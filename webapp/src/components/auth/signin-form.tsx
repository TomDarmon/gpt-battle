"use client";
import { type ErrorContext } from "@better-fetch/fetch";
import { zodResolver } from "@hookform/resolvers/zod";
import { Github } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import LoadingButton from "~/components/loading-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { useToast } from "~/hooks/use-toast";
import { cn } from "~/lib/utils";
import { signInSchema, type SignInSchemaType } from "~/lib/zod";
import { authClient } from "~/server/auth/client";

export function SigninForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const { toast } = useToast();
  const [pendingCredentials, setPendingCredentials] = useState(false);
  const [pendingGithub, setPendingGithub] = useState(false);

  const form = useForm<SignInSchemaType>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSignInWithGithub = async () => {
    await authClient.signIn.social(
      {
        provider: "github",
      },
      {
        onRequest: () => {
          setPendingGithub(true);
        },
        onSuccess: async () => {
          router.refresh();
          // router.push("/");
        },
        onError: (ctx: ErrorContext) => {
          toast({
            title: "Something went wrong",
            description: ctx.error.message ?? "Something went wrong.",
            variant: "destructive",
          });
        },
      },
    );

    setPendingGithub(false);
  };

  const handleCredentialsSignIn = async (values: SignInSchemaType) => {
    await authClient.signIn.email(
      {
        email: values.email,
        password: values.password,
      },
      {
        onRequest: () => {
          setPendingCredentials(true);
        },
        onSuccess: async () => {
          router.push("/");
        },
        onError: (ctx: ErrorContext) => {
          toast({
            title: (ctx.error?.code as string) ?? "Something went wrong",
            description: ctx.error.message ?? "Something went wrong.",
            variant: "destructive",
          });
        },
      },
    );

    setPendingCredentials(false);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Signin</CardTitle>
          <CardDescription>
            Enter your email below to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCredentialsSignIn)}
              className="space-y-6"
            >
              {["email", "password"].map((field) => (
                <FormField
                  control={form.control}
                  key={field}
                  name={field as keyof SignInSchemaType}
                  render={({ field: fieldProps }) => (
                    <FormItem>
                      <FormLabel>
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type={field === "password" ? "password" : "email"}
                          placeholder={`Enter your ${field}`}
                          {...fieldProps}
                          autoComplete={
                            field === "password" ? "current-password" : "email"
                          }
                        />
                      </FormControl>
                      <FormMessage />
                      {field === "password" && (
                        <div className="flex">
                          <Link
                            href="/forgot-password"
                            className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                          >
                            Forgot your password?
                          </Link>
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              ))}
              <LoadingButton pending={pendingCredentials}>
                Sign in
              </LoadingButton>
              <LoadingButton
                onClick={handleSignInWithGithub}
                pending={pendingGithub}
                type="button"
                variant={"secondary"}
                className="w-full"
              >
                <Github className="mr-1 h-4 w-4" />
                Login with Github
              </LoadingButton>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
