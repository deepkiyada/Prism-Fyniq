import { format } from "date-fns";
import { BillingBoard } from "@/components/billing-board";
import { getBillingBoard } from "@/lib/billing-board";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { month: monthParam } = await searchParams;
  const month = monthParam ?? format(new Date(), "yyyy-MM");

  let board = null;
  let error = "";

  try {
    board = await getBillingBoard(month);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load billing board.";
  }

  return (
    <main className="min-w-0">
      {error ? (
        <p className="mb-4 text-sm text-destructive">{error}</p>
      ) : board ? (
        <BillingBoard data={board} />
      ) : null}
    </main>
  );
}
