// components/facebook-sign-in.tsx
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Facebook } from "@/components/ui/facebook";

const FacebookSignIn = () => {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("facebook");
      }}
    >
      <Button className="w-full" variant="outline">
        <Facebook />
        Continue with Facebook
      </Button>
    </form>
  );
};

export { FacebookSignIn };