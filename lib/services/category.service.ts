// lib/services/category.service.ts
import db from "@/lib/prisma";
import { categorySchema, CategoryInput } from "@/schemas/category";
import { slugify } from "@/lib/utils";

/**
 * CategoryService handles business logic for category operations.
 */
class CategoryService {
  /**
   * Creates a new category after validating input and ensuring uniqueness.
   * @param data - The category data.
   * @returns The created category.
   * @throws Error if validation fails or category already exists.
   */
  public async createCategory(data: CategoryInput) {
    // Validate the incoming data using the schema
    const validatedData = categorySchema.parse(data);

    // Generate a slug from the category name
    const slug = slugify(validatedData.name);

    // Check for an existing category with the same name
    const existingCategory = await db.category.findUnique({
      where: { name: validatedData.name },
    });

    if (existingCategory) {
      throw new Error("Category already exists.");
    }

    // Create the new category in the database including the slug
    const category = await db.category.create({
      data: { name: validatedData.name, slug },
    });

    return category;
  }
}

const categoryService = new CategoryService();
export default categoryService;