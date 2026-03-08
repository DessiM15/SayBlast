"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Users,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";

export interface AudienceListItem {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { contacts: number };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AudienceListProps {
  initialLists: AudienceListItem[];
  initialPagination?: PaginationData;
}

export default function AudienceList({ initialLists, initialPagination }: AudienceListProps) {
  const [audienceLists, setAudienceLists] = useState<AudienceListItem[]>(initialLists);
  const [pagination, setPagination] = useState<PaginationData>(
    initialPagination ?? { page: 1, limit: 25, total: initialLists.length, totalPages: 1 }
  );
  const [page, setPage] = useState(initialPagination?.page ?? 1);
  const [limit, setLimit] = useState(initialPagination?.limit ?? 25);
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  async function refreshList(p: number, l: number) {
    const response = await fetch(`/api/audiences?page=${p}&limit=${l}`);
    if (response.ok) {
      const data = (await response.json()) as {
        audienceLists: AudienceListItem[];
        pagination: PaginationData;
      };
      setAudienceLists(data.audienceLists);
      setPagination(data.pagination);
    }
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
    refreshList(newPage, limit);
  }

  function handleLimitChange(newLimit: number) {
    setLimit(newLimit);
    setPage(1);
    refreshList(1, newLimit);
  }

  async function handleCreate() {
    if (!newName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/audiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to create");
      }

      toast.success("Audience list created!");
      setNewName("");
      setNewDescription("");
      setDialogOpen(false);

      setPage(1);
      await refreshList(1, limit);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Audiences</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your contact lists for email campaigns
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              New List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Audience List</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="list-name">List Name</Label>
                <Input
                  id="list-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Newsletter Subscribers"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="list-description">Description (optional)</Label>
                <Input
                  id="list-description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description of this list"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={isCreating || !newName.trim()}
                className="bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-90"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create List"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {audienceLists.length === 0 && pagination.total === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">No audience lists yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a list and add contacts to start sending campaigns
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {audienceLists.map((list) => (
              <Link
                key={list.id}
                href={`/audiences/${list.id}`}
                className="group"
              >
                <Card className="transition-all hover:border-[#FDA085]/50 hover:shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-base">{list.name}</CardTitle>
                      {list.description && (
                        <CardDescription className="line-clamp-1">
                          {list.description}
                        </CardDescription>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {list._count.contacts}{" "}
                        {list._count.contacts === 1 ? "contact" : "contacts"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          {pagination.total > 0 && (
            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Showing</span>
                <Select
                  value={String(limit)}
                  onValueChange={(val) => handleLimitChange(Number(val))}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span>
                  of {pagination.total}{" "}
                  {pagination.total === 1 ? "list" : "lists"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
