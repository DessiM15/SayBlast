"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, ChevronLeft, ChevronRight, Trash2, Users } from "lucide-react";

export interface ContactItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  totalContacts: number;
  totalPages: number;
}

interface ContactTableProps {
  contacts: ContactItem[];
  onDelete: (contactId: string) => void;
  isDeleting: string | null;
  pagination: PaginationData;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export default function ContactTable({
  contacts,
  onDelete,
  isDeleting,
  pagination,
  onPageChange,
  onLimitChange,
}: ContactTableProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingContact = pendingDeleteId
    ? contacts.find((c) => c.id === pendingDeleteId)
    : null;

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">No contacts yet</p>
          <p className="text-xs text-muted-foreground">
            Add contacts manually or upload a CSV file
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Email</th>
            <th className="pb-2 pr-4 font-medium">First Name</th>
            <th className="pb-2 pr-4 font-medium">Last Name</th>
            <th className="pb-2 pr-4 font-medium">Added</th>
            <th className="pb-2 font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id} className="border-b last:border-0">
              <td className="py-2.5 pr-4 font-medium">{contact.email}</td>
              <td className="py-2.5 pr-4 text-muted-foreground">
                {contact.firstName || "—"}
              </td>
              <td className="py-2.5 pr-4 text-muted-foreground">
                {contact.lastName || "—"}
              </td>
              <td className="py-2.5 pr-4 text-muted-foreground">
                {new Date(contact.createdAt).toLocaleDateString()}
              </td>
              <td className="py-2.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setPendingDeleteId(contact.id)}
                  disabled={isDeleting === contact.id}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {pagination.totalContacts > 0 && (
        <div className="flex items-center justify-between border-t pt-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Showing</span>
            <Select
              value={String(pagination.limit)}
              onValueChange={(val) => onLimitChange(Number(val))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="500">500</SelectItem>
              </SelectContent>
            </Select>
            <span>
              of {pagination.totalContacts}{" "}
              {pagination.totalContacts === 1 ? "contact" : "contacts"}
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
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <Dialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Contact
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {pendingContact && (
            <div className="rounded-md bg-muted px-3 py-2 text-sm font-medium">
              {pendingContact.email}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDeleteId) {
                  onDelete(pendingDeleteId);
                  setPendingDeleteId(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
