import { Card, CardContent } from "@/components/ui";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">404 - Page Not Found</h1>
          <p className="text-muted-foreground">
            The module you are looking for does not exist or requires different privileges.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
