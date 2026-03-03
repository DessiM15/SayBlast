import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.onboardingComplete) {
    redirect("/register");
  }

  return (
    <div className="flex min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-gray-900 focus:shadow-lg focus:ring-2 focus:ring-primary focus:outline-none"
      >
        Skip to main content
      </a>
      <Sidebar />
      <div className="flex flex-1 flex-col md:ml-64">
        <Topbar user={session} />
        <main id="main-content" className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
