interface Props {
  score: number;
}

function scoreColor(score: number): string {
  if (score >= 80) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  if (score >= 60) return "bg-blue-500/10 text-blue-400 border-blue-500/30";
  if (score >= 40) return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
  return "bg-red-500/10 text-red-400 border-red-500/30";
}

export default function ScoreBadge({ score }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold border ${scoreColor(score)}`}
    >
      {score}/100
    </span>
  );
}
