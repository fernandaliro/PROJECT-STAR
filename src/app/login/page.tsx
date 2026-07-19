import { LoginForm } from "@/components/shared/login-form";

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const next = typeof searchParams.next === "string" ? searchParams.next : "/";

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-xs space-y-4">
        <h1 className="text-center text-xl font-semibold">Star</h1>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
