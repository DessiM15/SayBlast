"use client";

import { Button } from "@/components/ui/button";
import { Trash2, Users } from "lucide-react";

export interface ContactItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
}

interface ContactTableProps {
  contacts: ContactItem[];
  onDelete: (contactId: string) => void;
  isDeleting: string | null;
}

export default function ContactTable({
  contacts,
  onDelete,
  isDeleting,
}: ContactTableProps) {
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
                  onClick={() => onDelete(contact.id)}
                  disabled={isDeleting === contact.id}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
