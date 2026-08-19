import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, Loader2, Stethoscope, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { MentionMedicale } from "@/components/MentionMedicale";
import { AlerteUrgence } from "@/components/AlerteUrgence";
import { analyserSymptomes } from "@/lib/analyse.functions";
import { detecterUrgences, GROUPES_SENSIBLES, LIBELLES_GROUPES, type DrapeauRouge } from "@/lib/triage";
import { analyseInputSchema, type AnalyseResultat } from "@/lib/analyse.types";
import { APP_CONFIG, NIVEAUX_URGENCE } from "@/config/santeclair";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/evaluation")({
  head: () => ({
    meta: [
      { title: "Nouvelle évaluation — SantéClair" },
      { name: "description", content: "Décrivez vos symptômes et recevez une orientation prudente vers le bon professionnel de santé." },
      { property: "og:title", content: "Nouvelle évaluation — SantéClair" },
      { property: "og:description", content: "Une pré-évaluation prudente de vos symptômes, jamais un diagnostic." },
    ],
  }),
  component: Evaluation,
});

const QUESTIONS = [
  "Avez-vous de la fièvre ?",
  "Les symptômes vous empêchent-ils de dormir ou de travailler ?",
  "Avez-vous déjà eu ces symptômes auparavant ?",
  "Avez-vous récemment voyagé ou été en contact avec une personne malade ?",
];

function Evaluation() {
  const { user } = useAuth();
  const analyser = useServerFn(analyserSymptomes);

  const [symptomes, setSymptomes] = useState("");
  const [duree, setDuree] = useState("");
  const [intensite, setIntensite] = useState(5);
  const [evolution, setEvolution] = useState("");
  const [age, setAge] = useState("");
  const [antecedents, setAntecedents] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicaments, setMedicaments] = useState("");
  const [groupes, setGroupes] = useState<string[]>([]);
  const [reponses, setReponses] = useState<string[]>(QUESTIONS.map(() => ""));
  const [consentement, setConsentement] = useState(false);

  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState<AnalyseResultat | null>(null);
  const [drapeauxLocaux, setDrapeauxLocaux] = useState<DrapeauRouge[]>([]);
  const [questionsManquantes, setQuestionsManquantes] = useState<string[]>([]);
  const [reponsesComplements, setReponsesComplements] = useState<string[]>([]);
  const requeteEnCours = useRef(false);
  const controleurRef = useRef<AbortController | null>(null);

  const enregistrer = async (r: Extract<AnalyseResultat, { statut: "complete" }>) => {
    if (!user || !consentement) return;
    const { error } = await supabase.from("evaluations").insert({
      user_id: user.id,
      symptomes,
      duree: duree || null,
      intensite,
      evolution: evolution || null,
      age: age === "" ? null : Number(age),
      contexte: { groupes },
      resume: r.resume,
      urgence: r.urgence,
      causes: r.causes,
      conseils: r.conseils,
      professionnel: r.professionnel,
      signes_alerte: r.signesAlerte,
      fiable: true,
    });
    if (error) toast.error("L'évaluation n'a pas pu être enregistrée.");
    else toast.success("Évaluation enregistrée dans votre historique privé.");
  };

  const soumettre = async (event: React.FormEvent) => {
    event.preventDefault();
    if (requeteEnCours.current) return;
    setResultat(null);

    // 1. Détection immédiate des signes d'urgence, côté navigateur
    const drapeaux = detecterUrgences(`${symptomes} ${evolution} ${reponses.join(" ")}`);
    setDrapeauxLocaux(drapeaux);
    if (drapeaux.length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const parsed = analyseInputSchema.safeParse({
      symptomes,
      duree: duree || undefined,
      intensite,
      evolution: evolution || undefined,
      age: age === "" ? null : Number(age),
      antecedents: antecedents || undefined,
      allergies: allergies || undefined,
      medicaments: medicaments || undefined,
      groupes,
      reponses: reponses.filter(Boolean),
      complements: questionsManquantes.map((question, index) => ({
        question,
        reponse: reponsesComplements[index] ?? "",
      })),
      questionsPosees: questionsManquantes,
      iteration: questionsManquantes.length > 0 ? 1 : 0,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Veuillez vérifier vos réponses.");
      return;
    }

    requeteEnCours.current = true;
    setEnCours(true);
    const controleur = new AbortController();
    controleurRef.current = controleur;
    const delaiMaximum = window.setTimeout(() => controleur.abort("timeout"), 60_000);
    try {
      const r = await analyser({ data: parsed.data, signal: controleur.signal });
      setResultat(r);
      if (r.statut === "needs_more_info") {
        setQuestionsManquantes(r.missingQuestions.slice(0, 3));
        setReponsesComplements(r.missingQuestions.map(() => ""));
      } else if (r.statut === "complete") {
        setQuestionsManquantes([]);
        setReponsesComplements([]);
        if (consentement) await enregistrer(r);
      }
    } catch (error) {
      setResultat({
        statut: "error",
        message:
          error instanceof DOMException && error.name === "AbortError"
            ? "L'analyse a été annulée ou a dépassé une minute. Vous pouvez réessayer."
            : "L'analyse a échoué. Vérifiez votre connexion internet puis réessayez.",
      });
    } finally {
      window.clearTimeout(delaiMaximum);
      controleurRef.current = null;
      requeteEnCours.current = false;
      setEnCours(false);
    }
  };

  const annuler = () => controleurRef.current?.abort("user");

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Nouvelle évaluation</h1>
        <p className="text-muted-foreground">
          Décrivez vos symptômes avec vos propres mots. Rien n'est enregistré sans votre accord.
        </p>
      </header>

      <MentionMedicale />

      {drapeauxLocaux.length > 0 && <AlerteUrgence drapeaux={drapeauxLocaux} />}

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Vos symptômes</CardTitle>
          <CardDescription>Plus votre description est précise, plus l'orientation est utile.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={soumettre} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="symptomes">Quels symptômes ressentez-vous ? *</Label>
              <Textarea
                id="symptomes"
                required
                maxLength={APP_CONFIG.limites.longueurMaxSymptomes}
                rows={4}
                className="rounded-xl"
                placeholder="Exemple : maux de tête depuis 3 jours, fatigue et nez bouché."
                value={symptomes}
                onChange={(e) => setSymptomes(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duree">Depuis combien de temps ?</Label>
                <Input
                  id="duree"
                  className="h-12 rounded-xl"
                  maxLength={120}
                  placeholder="3 jours, 2 semaines…"
                  value={duree}
                  onChange={(e) => setDuree(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Âge</Label>
                <Input
                  id="age"
                  type="number"
                  min={0}
                  max={120}
                  className="h-12 rounded-xl"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="intensite">Intensité ressentie : {intensite} / 10</Label>
              <Slider
                id="intensite"
                min={1}
                max={10}
                step={1}
                value={[intensite]}
                onValueChange={([v]) => setIntensite(v ?? 5)}
                aria-label="Intensité des symptômes de 1 à 10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evolution">Comment cela évolue-t-il ?</Label>
              <Textarea
                id="evolution"
                rows={2}
                maxLength={500}
                className="rounded-xl"
                placeholder="Cela s'aggrave, reste stable, s'améliore…"
                value={evolution}
                onChange={(e) => setEvolution(e.target.value)}
              />
            </div>

            <fieldset className="space-y-3 rounded-2xl border border-border p-4">
              <legend className="px-2 text-sm font-medium">Situations particulières (facultatif)</legend>
              {GROUPES_SENSIBLES.map((g) => (
                <div key={g} className="flex items-center gap-3">
                  <Checkbox
                    id={`groupe-${g}`}
                    checked={groupes.includes(g)}
                    onCheckedChange={(v) =>
                      setGroupes((prev) => (v ? [...prev, g] : prev.filter((x) => x !== g)))
                    }
                  />
                  <Label htmlFor={`groupe-${g}`} className="text-sm font-normal">
                    {LIBELLES_GROUPES[g]}
                  </Label>
                </div>
              ))}
            </fieldset>

            <fieldset className="space-y-4 rounded-2xl border border-border p-4">
              <legend className="px-2 text-sm font-medium">
                Antécédents, allergies et médicaments (uniquement si vous le souhaitez)
              </legend>
              <div className="space-y-2">
                <Label htmlFor="antecedents">Antécédents</Label>
                <Textarea
                  id="antecedents"
                  rows={2}
                  maxLength={500}
                  className="rounded-xl"
                  value={antecedents}
                  onChange={(e) => setAntecedents(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  rows={2}
                  maxLength={500}
                  className="rounded-xl"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicaments">Médicaments en cours</Label>
                <Textarea
                  id="medicaments"
                  rows={2}
                  maxLength={500}
                  className="rounded-xl"
                  value={medicaments}
                  onChange={(e) => setMedicaments(e.target.value)}
                />
              </div>
            </fieldset>

            {questionsManquantes.length > 0 && (
              <fieldset className="space-y-4 rounded-2xl border border-primary/40 bg-primary/5 p-4">
                <legend className="px-2 text-sm font-semibold">Informations complémentaires nécessaires</legend>
                {questionsManquantes.map((question, index) => (
                  <div key={question} className="space-y-2">
                    <Label htmlFor={`complement-${index}`}>{question}</Label>
                    <Input
                      id={`complement-${index}`}
                      required
                      maxLength={500}
                      className="h-12 rounded-xl"
                      value={reponsesComplements[index] ?? ""}
                      onChange={(e) =>
                        setReponsesComplements((precedentes) =>
                          precedentes.map((reponse, i) => (i === index ? e.target.value : reponse)),
                        )
                      }
                    />
                  </div>
                ))}
              </fieldset>
            )}

            <fieldset className="space-y-4 rounded-2xl border border-border p-4">
              <legend className="px-2 text-sm font-medium">Quelques questions complémentaires</legend>
              {QUESTIONS.map((q, i) => (
                <div key={q} className="space-y-2">
                  <Label htmlFor={`q-${i}`}>{q}</Label>
                  <Input
                    id={`q-${i}`}
                    className="h-12 rounded-xl"
                    maxLength={300}
                    value={reponses[i] ?? ""}
                    onChange={(e) =>
                      setReponses((prev) => prev.map((r, idx) => (idx === i ? e.target.value : r)))
                    }
                  />
                </div>
              ))}
            </fieldset>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
              <Label htmlFor="consentement" className="text-sm font-normal">
                J'accepte que cette évaluation soit enregistrée dans mon historique privé.
              </Label>
              <Switch id="consentement" checked={consentement} onCheckedChange={setConsentement} />
            </div>

            <Button type="submit" disabled={enCours} className="h-14 w-full rounded-2xl text-base font-semibold">
              {enCours ? (
                <>
                  <Loader2 className="size-5 animate-spin" aria-hidden /> Analyse en cours…
                </>
              ) : (
                <>
                  <Stethoscope className="size-5" aria-hidden /> Analyser mes symptômes
                </>
              )}
            </Button>
            {enCours && (
              <Button type="button" variant="outline" onClick={annuler} className="h-12 w-full rounded-2xl">
                <X className="size-4" aria-hidden /> Annuler l'analyse
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {resultat && <Resultat resultat={resultat} />}
    </div>
  );
}

function Resultat({ resultat }: { resultat: AnalyseResultat }) {
  if (resultat.statut === "urgent") {
    return <AlerteUrgence drapeaux={resultat.drapeaux} message={resultat.message} />;
  }

  if (resultat.statut === "error") {
    return (
      <Card className="rounded-3xl border-destructive/40" role="alert">
        <CardHeader>
          <AlertCircle className="size-7 text-destructive" aria-hidden />
          <CardTitle>Analyse impossible</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">{resultat.message}</CardContent>
      </Card>
    );
  }

  if (resultat.statut === "needs_more_info") {
    return (
      <Card className="rounded-3xl border-primary/40" role="status">
        <CardHeader>
          <AlertCircle className="size-7 text-primary" aria-hidden />
          <CardTitle>Quelques précisions sont nécessaires</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <ul className="list-disc space-y-1 pl-5">
            {resultat.missingQuestions.map((question) => <li key={question}>{question}</li>)}
          </ul>
        </CardContent>
      </Card>
    );
  }

  const niveau = NIVEAUX_URGENCE[resultat.urgence];

  return (
    <section className="space-y-4" aria-live="polite">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Résumé de vos symptômes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <p>{resultat.resume}</p>
          <div className={`rounded-2xl p-4 ${niveau.classe}`}>
            <p className="text-base font-bold">{niveau.libelle}</p>
            <p className="text-sm">{niveau.description}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Hypothèses possibles</CardTitle>
          <CardDescription>Ce ne sont pas des diagnostics, seulement des pistes à vérifier.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {resultat.causes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Ce que vous pouvez faire maintenant, sans danger</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {resultat.conseils.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Qui consulter</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">{resultat.professionnel}</CardContent>
      </Card>

      <Card className="rounded-3xl border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle>Signes qui doivent vous pousser à consulter rapidement</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {resultat.signesAlerte.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <MentionMedicale />
    </section>
  );
}
