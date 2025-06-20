import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

const CardWrapper = ({
  label,
  title,
  backButtonHref,
  backButtonLabel,
  children,
}) => {
  return (
    <Card className="w-100 shadow-md dark:bg-slate-800 dark:border-slate-700">
      <CardHeader>
        <div className="w-full flex flex-col space-y-2">
          <h1 className="text-xl font-semibold dark:text-white">{title}</h1>
          <p className="text-muted-foreground text-sm dark:text-slate-300">
            {label}
          </p>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardFooter>
        <Button variant="link" className="font-normal w-full" size="sm" asChild>
          <Link to={backButtonHref}>{backButtonLabel}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CardWrapper;
