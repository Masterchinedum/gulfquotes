// lib/services/category.service.ts
import db from "@/lib/prisma";
import { categorySchema, CategoryInput, CategoryUpdateInput } from "@/schemas/category";
import { slugify } from "@/lib/utils";
import { AppError } from "@/lib/api-error";

/**
 * CategoryService handles business logic for category operations.
 */
class CategoryService {
  /**
   * Generates and validates a unique slug for a category
   */
  private async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    const baseSlug = slugify(name);
    const existingCategory = await db.category.findFirst({
      where: {
        slug: baseSlug,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    if (!existingCategory) {
      return baseSlug;
    }

    throw new AppError("Category with similar slug already exists", "DUPLICATE_SLUG", 400);
  }

  /**
   * Validates slug uniqueness
   */
  private async validateSlug(slug: string, excludeId?: string): Promise<void> {
    const existingCategory = await db.category.findFirst({
      where: {
        slug,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    if (existingCategory) {
      throw new AppError("Category with this slug already exists", "DUPLICATE_SLUG", 400);
    }
  }

  /**
   * Creates a new category after validating input and ensuring uniqueness.
   */
  public async createCategory(data: CategoryInput) {
    const validatedData = categorySchema.parse(data);
    let slug: string;

    if (validatedData.autoGenerateSlug || !validatedData.slug) {
      slug = await this.generateUniqueSlug(validatedData.name);
    } else {
      slug = validatedData.slug;
      await this.validateSlug(slug);
    }

    const existingCategory = await db.category.findUnique({
      where: { name: validatedData.name },
    });

    if (existingCategory) {
      throw new AppError("Category already exists", "DUPLICATE_CATEGORY", 400);
    }

    return await db.category.create({
      data: {
        name: validatedData.name,
        slug,
      },
    });
  }

  /**
   * Updates an existing category
   */
  public async updateCategory(id: string, data: CategoryUpdateInput) {
    const existingCategory = await db.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new AppError("Category not found", "NOT_FOUND", 404);
    }

    const validatedData = categorySchema.parse(data);
    let slug: string;

    if (validatedData.autoGenerateSlug || !validatedData.slug) {
      slug = await this.generateUniqueSlug(validatedData.name, id);
    } else {
      slug = validatedData.slug;
      await this.validateSlug(slug, id);
    }

    return await db.category.update({
      where: { id },
      data: {
        name: validatedData.name,
        slug,
      },
    });
  }

  /**
   * Retrieves a category by its ID
   */
  public async getById(id: string) {
    const category = await db.category.findUnique({
      where: { id }
    });

    if (!category) {
      throw new AppError("Category not found", "NOT_FOUND", 404);
    }

    return category;
  }

  /**
   * Deletes a category by ID
   */
  public async deleteCategory(id: string): Promise<void> {
    const existingCategory = await db.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      throw new AppError("Category not found", "NOT_FOUND", 404);
    }

    await db.category.delete({
      where: { id }
    });
  }
}

const categoryService = new CategoryService();
export default categoryService;