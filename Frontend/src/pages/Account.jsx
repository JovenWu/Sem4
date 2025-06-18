import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageLayout from "@/layouts/PageLayout";
import { format } from "date-fns";
import { useOutletContext } from "react-router-dom";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { FaCalendar } from "react-icons/fa";

const profileSchema = z.object({
  name: z.string().min(1, "Your name is required"),
  dateOfBirth: z.date({
    required_error: "Date of Birth is required",
  }),
});

const Account = () => {
  const { toggleSidebar, isMobile } = useOutletContext();

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      dateOfBirth: undefined,
    },
  });

  const onSubmit = (values) => {
    console.log("Form values:", values);
  };

  return (
    <PageLayout
      title="Account"
      toggleSidebar={toggleSidebar}
      isMobile={isMobile}
    >
      <div className="mt-4">
        <div className="mb-4">
          <h2 className="text-2xl font-bold tracking-tight mb-2">Settings</h2>
          <p className="text-gray-600">Manage your Account settings here.</p>
        </div>
      </div>
      <Separator className="my-6" />
      <div className={"w-full max-w-4xl mx-auto"}>
        <div className="flex flex-col">
          <span className="text-lg font-semibold mx-6">Account</span>
          <span className="text-gray-600 mx-6">
            Update your account settings.
          </span>
        </div>
        <Separator orientation="horizontal" className="my-6" />
        <div className="space-y-4 mx-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="eg. Will"
                        {...field}
                        className="max-w-sm"
                      />
                    </FormControl>
                    <FormDescription>
                      This is the name that will be displayed on your profile
                      and in emails.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Of Birth</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`max-w-sm pl-3 text-left font-normal ${
                              !field.value ? "text-muted-foreground" : ""
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Select date</span>
                            )}
                            <FaCalendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Your date of birth is used to calculate your age.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full md:w-auto">
                Update Account
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </PageLayout>
  );
};

export default Account;
