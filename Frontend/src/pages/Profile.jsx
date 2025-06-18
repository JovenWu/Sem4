import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageLayout from "../layouts/PageLayout";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const SUPPORTED_FORMATS = ["image/jpeg", "image/png", "image/jpg"];

const profileSchema = z
  .object({
    profilePicture: z
      .instanceof(File)
      .nullable()
      .optional()
      .refine((file) => {
        if (!file) return true;
        return file.size <= MAX_FILE_SIZE;
      }, `Profile picture must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
      .refine((file) => {
        if (!file) return true;
        return SUPPORTED_FORMATS.includes(file.type);
      }, "Unsupported file format. Please upload a PNG, JPG or JPEG image."),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    bio: z
      .string()
      .max(500, "Bio must be less than 500 characters")
      .optional()
      .or(z.literal("")),
    emails: z
      .array(
        z.string().email("Invalid email format").min(1, "Email cannot be empty")
      )
      .min(1, "At least one email is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .or(z.literal(""))
      .optional(),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .or(z.literal(""))
      .optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword && !data.password) {
        return false;
      }
      return true;
    },
    {
      message: "Current password is required to set a new password",
      path: ["password"],
    }
  )
  .refine(
    (data) => {
      if (
        data.newPassword &&
        data.password &&
        data.newPassword === data.password
      ) {
        return false;
      }
      return true;
    },
    {
      message: "New password must be different from current password",
      path: ["newPassword"],
    }
  );

const Profile = () => {
  const { toggleSidebar, isMobile } = useOutletContext();
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      profilePicture: null,
      firstName: "",
      lastName: "",
      bio: "",
      email: "",
      password: "",
      newPassword: "",
    },
  });

  const onSubmit = (values) => {
    console.log("Form values:", values);
  };

  const handleDeleteAccount = () => {
    console.log("Account deletion confirmed!");
    setShowDeleteAccountDialog(false);
  };

  const [preview, setPreview] = useState(null);

  return (
    <PageLayout
      title="Profile"
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
          <span className="text-lg font-semibold mx-6">Profile Settings</span>
          <span className="text-gray-600 mx-6">
            This is how others will see you
          </span>
        </div>
        <Separator orientation="horizontal" className="my-6" />
        <div className="space-y-4 mx-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="profilePicture"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img
                          src={
                            preview ||
                            "https://api.dicebear.com/9.x/notionists/svg"
                          }
                          alt="Profile Preview"
                          className="h-24 w-24 rounded-full object-cover bg-violet-500"
                        />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <FormLabel className="text-lg font-semibold">
                          Profile picture
                        </FormLabel>
                        <p className="text-sm text-gray-500">
                          PNG, JPEG under 15MB
                        </p>
                      </div>
                      <FormControl>
                        <div className="flex space-x-2">
                          <Button asChild type="button" variant="outline">
                            <label
                              htmlFor="profilePicture"
                              className="cursor-pointer"
                            >
                              <Input
                                id="profilePicture"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  const handleFile = e.target.files?.[0];
                                  field.onChange(handleFile);
                                  if (handleFile) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setPreview(reader.result);
                                    };
                                    reader.readAsDataURL(handleFile);
                                  } else {
                                    setPreview(null);
                                  }
                                }}
                              />
                              Upload Profile
                            </label>
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            className="hover:bg-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="eg. Will" {...field} />
                      </FormControl>
                      <FormDescription>
                        This is your public display name.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="eg. Smith" {...field} />
                      </FormControl>
                      <FormDescription>
                        This is your public display name.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us a bit about yourself"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="example@gmail.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This is the email address associated with your account.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="********"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Input your current password.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="********"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Input your new password.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end p-6 space-x-3">
                <Button type="submit" className="w-full md:w-auto">
                  Update Account
                </Button>
                <AlertDialog
                  open={showDeleteAccountDialog}
                  onOpenChange={setShowDeleteAccountDialog}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      type="button"
                      className="w-full md:w-auto"
                      onClick={() => setShowDeleteAccountDialog(true)}
                    >
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your account and remove your data from our
                        servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount}>
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </PageLayout>
  );
};

export default Profile;
