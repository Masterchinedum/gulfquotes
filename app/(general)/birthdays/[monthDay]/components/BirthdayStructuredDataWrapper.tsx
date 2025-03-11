import { authorProfileService } from "@/lib/services/author-profile.service";
import { BirthdayStructuredData } from "@/components/authors/BirthdayStructuredData";

interface BirthdayStructuredDataWrapperProps {
  day: number;
  month: number;
}

// This is a server component that fetches data and passes it to the client component
export async function BirthdayStructuredDataWrapper({ day, month }: BirthdayStructuredDataWrapperProps) {
  try {
    // Fetch the data server-side
    const authorsData = await authorProfileService.getAuthorsByBirthday({
      day,
      month,
      page: 1,
      limit: 30 // Fetch enough for SEO purposes
    });
    
    // Pass the data to the client component
    return (
      <BirthdayStructuredData
        day={day}
        month={month}
        authors={authorsData.items}
        totalAuthors={authorsData.total}
      />
    );
  } catch (error) {
    console.error("Failed to fetch birthday structured data", error);
    return null; // Return null if there's an error
  }
}