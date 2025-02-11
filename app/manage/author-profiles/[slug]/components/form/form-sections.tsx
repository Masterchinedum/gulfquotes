// File: app/manage/author-profiles/[slug]/components/form/form-sections.tsx
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { UpdateAuthorProfileInput } from "@/schemas/author-profile";
import { EditImageUpload } from "./image-upload"; // Update import

interface FormSectionsProps {
  form: UseFormReturn<UpdateAuthorProfileInput>;
  disabled?: boolean;
}

export function FormSections({ form, disabled }: FormSectionsProps) {
  return (
    <div className="space-y-6">
      {/* Basic Info Section */}
      <div className="space-y-4">
        <div className="text-lg font-semibold">Basic Information</div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input disabled={disabled} placeholder="Author's name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Life Details Section */}
      <div className="space-y-4">
        <div className="text-lg font-semibold">Life Details</div>
        <FormField
          control={form.control}
          name="born"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Born</FormLabel>
              <FormControl>
                <Input 
                  disabled={disabled} 
                  placeholder="e.g., Born in Dublin, Ireland - October 16, 1854" 
                  {...field}
                  value={field.value ?? ''} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="died"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Died</FormLabel>
              <FormControl>
                <Input 
                  disabled={disabled} 
                  placeholder="e.g., November 30, 1900" 
                  {...field}
                  value={field.value ?? ''} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="influences"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Influences</FormLabel>
              <FormControl>
                <Input 
                  disabled={disabled} 
                  placeholder="Comma-separated list of influences" 
                  {...field}
                  value={field.value ?? ''} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Biography Section */}
      <div className="space-y-4">
        <div className="text-lg font-semibold">Biography</div>
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Biography</FormLabel>
              <FormControl>
                <Textarea 
                  disabled={disabled} 
                  placeholder="Author's biography" 
                  className="h-32"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Update image upload section */}
      <EditImageUpload 
        form={form} 
        disabled={disabled} 
      />
    </div>
  );
}