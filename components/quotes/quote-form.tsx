"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createQuoteSchema, CreateQuoteInput } from "@/schemas/quote";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { Category, AuthorProfile } from "@prisma/client"; // Update existing import
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/ui/icons";
import { slugify } from "@/lib/utils"; // Import slugify utility

interface QuoteFormProps {
  categories: Category[];
  authorProfiles: AuthorProfile[];  // Add this
  initialData?: CreateQuoteInput;
}

export function QuoteForm({ categories, authorProfiles, initialData }: QuoteFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [charCount, setCharCount] = useState(initialData?.content?.length || 0);
  
  const form = useForm<CreateQuoteInput>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: initialData || {
      content: "",
      slug: "",
      categoryId: "",
      authorProfileId: "", // Add this default value
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: CreateQuoteInput) {
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error.message);
      }

      // Show success message
      toast({
        title: "Success",
        description: "Quote created successfully",
        variant: "default",
      });

      // Reset form
      form.reset();
      setCharCount(0);

      // Redirect to quotes list
      router.push("/manage/quotes");
      router.refresh();

    } catch (error) {
      // Show error message
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  }

  // Auto-generate slug based on content
  const handleAutoGenerateSlug = () => {
    const currentContent = form.getValues("content");
    if (currentContent) {
      const generatedSlug = slugify(currentContent.substring(0, 50));
      form.setValue("slug", generatedSlug);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quote Content</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Textarea
                    {...field}
                    placeholder="Enter your quote here..."
                    onChange={(e) => {
                      field.onChange(e);
                      setCharCount(e.target.value.length);
                    }}
                    disabled={isSubmitting}
                    className="h-32 resize-none"
                  />
                  <div className={`text-sm text-right ${
                    charCount > 1500 ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {charCount}/1500 characters
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* New Slug Field */}
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quote Slug</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Auto-generated or type a slug"
                    className="border border-gray-300 rounded p-2 flex-1"
                  />
                </FormControl>
                <Button type="button" onClick={handleAutoGenerateSlug}>
                  Auto-generate slug
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Enhanced Author Profile Field */}
        <FormField
          control={form.control}
          name="authorProfileId"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <div className="space-y-1">
                <FormLabel>Quote Author</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Select the original author of this quote
                </p>
              </div>
              
              <Select
                disabled={isSubmitting}
                onValueChange={field.onChange}
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an author" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {authorProfiles.map((author) => (
                    <SelectItem 
                      key={author.id} 
                      value={author.id}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col gap-1 py-1">
                        <span className="font-medium">{author.name}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {author.born && `${author.born}`}
                          {author.died && ` - ${author.died}`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Author Preview */}
              {field.value && (
                <div className="rounded-lg border bg-card p-4">
                  {authorProfiles.map((author) => 
                    author.id === field.value ? (
                      <div key={author.id} className="space-y-2">
                        <h4 className="font-semibold">{author.name}</h4>
                        {(author.born || author.died) && (
                          <p className="text-sm text-muted-foreground">
                            {author.born && `Born: ${author.born}`}
                            {author.died && ` • Died: ${author.died}`}
                          </p>
                        )}
                        {author.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {author.bio}
                          </p>
                        )}
                      </div>
                    ) : null
                  )}
                </div>
              )}

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                disabled={isSubmitting}
                onValueChange={field.onChange}
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isSubmitting ? "Creating..." : "Create Quote"}
          </Button>
        </div>
      </form>
    </Form>
  );
}