import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/primitives";
import { cn } from "@/utils/cn";

export default function SortableHead({ field, sort, order, onSort, children, className }) {
  const active = sort === field;
  const Icon = !active ? ChevronsUpDown : order === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className} aria-sort={active ? (order === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button"
        className={cn("inline-flex items-center gap-1 uppercase hover:text-foreground", active && "text-foreground")}
        onClick={() => onSort(field, active && order === "asc" ? "desc" : "asc")}>
        {children}
        <Icon className="size-3 opacity-70" />
      </button>
    </TableHead>
  );
}
