import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Unauthorized401() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <h1 className="text-8xl font-extrabold text-primary mb-6">401</h1>
      <h2 className="text-2xl font-semibold mb-2">Unauthorized Access</h2>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        Please log in with the appropriate credentials to access this resource.
      </p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
        <Button onClick={() => navigate("/app")}>Back to Home</Button>
      </div>
    </div>
  );
}
