"use client";

import { useState, useEffect, useCallback } from "react";
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
  Plus,
  Users,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface AudienceListItem {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { contacts: number };
}

export default function AudiencesPage() {
  const [audienceLists, setAudienceLists] = useState<AudienceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const loadAudiences = useCallback(async () => {
    try {
      const response = await fetch("/api/audiences");
      if (!response.ok) throw new Error("Failed to load");
      const data = (await response.json()) as { audienceLists: AudienceListItem[] };
      setAudienceLists(data.audienceLists);
    } catch {
      toast.error("Failed to load audience lists");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAudiences();
  }, [loadAudiences]);

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
      loadAudiences();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setIsCreating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading audiences...</p>
      </div>
    );
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
            <Button className="bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-white hover:opacity-90">
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
                className="bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-white hover:opacity-90"
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

      {audienceLists.length === 0 ? (
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
      )}
    </div>
  );
}
