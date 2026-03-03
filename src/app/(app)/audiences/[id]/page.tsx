"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import ContactTable from "@/components/audiences/contact-table";
import type { ContactItem } from "@/components/audiences/contact-table";
import CsvUpload from "@/components/audiences/csv-upload";

interface AudienceListData {
  id: string;
  name: string;
  description: string | null;
  _count: { contacts: number };
}

type PageStatus = "loading" | "ready" | "error";

export default function AudienceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const listId = params.id;

  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [audienceList, setAudienceList] = useState<AudienceListData | null>(null);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalContacts: 0,
    totalPages: 0,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);

  // Add contact form
  const [newEmail, setNewEmail] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const loadAudienceList = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/audiences/${listId}?page=${page}&limit=${limit}`
      );
      if (!response.ok) {
        setPageStatus("error");
        return;
      }
      const data = (await response.json()) as {
        audienceList: AudienceListData;
        contacts: ContactItem[];
        pagination: {
          page: number;
          limit: number;
          totalContacts: number;
          totalPages: number;
        };
      };
      setAudienceList(data.audienceList);
      setContacts(
        data.contacts.map((c) => ({
          ...c,
          createdAt:
            typeof c.createdAt === "string"
              ? c.createdAt
              : new Date(c.createdAt).toISOString(),
        }))
      );
      setPagination(data.pagination);
      setPageStatus("ready");
    } catch {
      setPageStatus("error");
    }
  }, [listId, page, limit]);

  useEffect(() => {
    loadAudienceList();
  }, [loadAudienceList]);

  async function handleAddContact() {
    if (!newEmail.trim()) return;

    setIsAdding(true);
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audienceListId: listId,
          contacts: [
            {
              email: newEmail.trim(),
              firstName: newFirstName.trim() || undefined,
              lastName: newLastName.trim() || undefined,
            },
          ],
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to add contact");
      }

      const data = (await response.json()) as { added: number; skipped: number };
      if (data.skipped > 0) {
        toast.error("This email already exists in the list");
      } else {
        toast.success("Contact added!");
        setNewEmail("");
        setNewFirstName("");
        setNewLastName("");
      }
      loadAudienceList();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add contact");
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDeleteContact(contactId: string) {
    setDeletingContactId(contactId);
    try {
      const response = await fetch("/api/contacts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId }),
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Contact removed");
      loadAudienceList();
    } catch {
      toast.error("Failed to remove contact");
    } finally {
      setDeletingContactId(null);
    }
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
  }

  function handleLimitChange(newLimit: number) {
    setLimit(newLimit);
    setPage(1);
  }

  async function handleDeleteList() {
    if (!confirm("Are you sure you want to delete this audience list? All contacts will be removed.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/audiences/${listId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Audience list deleted");
      router.push("/audiences");
    } catch {
      toast.error("Failed to delete audience list");
      setIsDeleting(false);
    }
  }

  if (pageStatus === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading audience list...</p>
      </div>
    );
  }

  if (pageStatus === "error" || !audienceList) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-sm text-destructive">Audience list not found</p>
        <Button variant="outline" asChild>
          <Link href="/audiences">Back to Audiences</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/audiences">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Audiences
            </Link>
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDeleteList}
          disabled={isDeleting}
          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          {isDeleting ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-3.5 w-3.5" />
          )}
          Delete List
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{audienceList.name}</h1>
        {audienceList.description && (
          <p className="mt-1 text-muted-foreground">{audienceList.description}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {pagination.totalContacts}{" "}
          {pagination.totalContacts === 1 ? "contact" : "contacts"}
        </p>
      </div>

      {/* Add Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" />
            Add Contact
          </CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <Label htmlFor="contact-email" className="text-xs">
                Email *
              </Label>
              <Input
                id="contact-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="contact-first" className="text-xs">
                First Name
              </Label>
              <Input
                id="contact-first"
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                placeholder="Jane"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="contact-last" className="text-xs">
                Last Name
              </Label>
              <Input
                id="contact-last"
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>
            <Button
              onClick={handleAddContact}
              disabled={isAdding || !newEmail.trim()}
              className="bg-gradient-to-r from-[#F6D365] to-[#FDA085] text-foreground hover:opacity-90"
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add"
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* CSV Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bulk Import</CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          <CsvUpload
            audienceListId={listId}
            onUploadComplete={loadAudienceList}
          />
        </div>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Contacts ({pagination.totalContacts})
          </CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          <ContactTable
            contacts={contacts}
            onDelete={handleDeleteContact}
            isDeleting={deletingContactId}
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </div>
      </Card>
    </div>
  );
}
