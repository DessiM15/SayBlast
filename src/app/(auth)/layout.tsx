import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#F6D365]/10 to-[#FDA085]/10 p-4">
      <div className="mb-8 flex flex-col items-center gap-3">
        <Image
          src="/logo.svg"
          alt="SayBlast"
          width={64}
          height={64}
          priority
        />
        <h1 className="bg-gradient-to-r from-[#F6D365] to-[#FDA085] bg-clip-text text-3xl font-bold text-transparent">
          SayBlast
        </h1>
        <p className="text-sm text-muted-foreground">
          Voice-powered email campaigns
        </p>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
