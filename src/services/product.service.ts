/**
 * =============================================================================
 * product.service.ts — ProductService (REPOSITORY for DummyJSON /products)
 * -----------------------------------------------------------------------------
 * WHY IT EXISTS:
 *   Same Repository role as PostService, but for an API with REAL-WORLD quirks:
 *     - Lists are WRAPPED in a paging envelope ({ products, total, skip, limit }).
 *     - CREATE uses a non-RESTful path: POST /products/add.
 *     - There's a dedicated /products/search endpoint.
 *   The repository ABSORBS these quirks so tests stay clean and uniform — the
 *   single biggest reason the Repository pattern pays off in real projects.
 * =============================================================================
 */
import { BaseApiService } from './base.service.js';
import type { ApiClient } from '../api-client/index.js';
import type { ApiResponse } from '../api-client/index.js';
import type {
  Product,
  ProductList,
  NewProduct,
  DeletedProduct,
} from '../models/product.model.js';

export class ProductService extends BaseApiService {
  public constructor(client: ApiClient) {
    super(client, '/products');
  }

  /** READ ALL — GET /products?limit&skip (returns the paging envelope). */
  public getAll(limit = 30, skip = 0): Promise<ApiResponse<ProductList>> {
    return this.client.get<ProductList>(this.resource, {
      params: { limit, skip },
    });
  }

  /** READ ONE — GET /products/{id}. */
  public getById(id: number): Promise<ApiResponse<Product>> {
    return this.client.get<Product>(this.url(id));
  }

  /** SEARCH — GET /products/search?q=... (a dedicated, non-CRUD endpoint). */
  public search(query: string): Promise<ApiResponse<ProductList>> {
    return this.client.get<ProductList>(`${this.resource}/search`, {
      params: { q: query },
    });
  }

  /** SORT — GET /products?sortBy=&order= (asc|desc). */
  public sortedBy(
    field: string,
    order: 'asc' | 'desc' = 'asc',
    limit = 30,
  ): Promise<ApiResponse<ProductList>> {
    return this.client.get<ProductList>(this.resource, {
      params: { sortBy: field, order, limit },
    });
  }

  /** FILTER — GET /products/category/{category}. */
  public byCategory(
    category: string,
    limit = 30,
  ): Promise<ApiResponse<ProductList>> {
    return this.client.get<ProductList>(
      `${this.resource}/category/${category}`,
      {
        params: { limit },
      },
    );
  }

  /** FIELD SELECTION — GET /products?select=title,price (sparse fieldsets). */
  public selectFields(
    fields: readonly string[],
    limit = 5,
  ): Promise<ApiResponse<ProductList>> {
    return this.client.get<ProductList>(this.resource, {
      params: { select: fields.join(','), limit },
    });
  }

  /** CREATE — POST /products/add (DummyJSON's non-standard create path). */
  public create(product: NewProduct): Promise<ApiResponse<Product>> {
    return this.client.post<Product>(`${this.resource}/add`, {
      data: product,
    });
  }

  /** REPLACE — PUT /products/{id}. */
  public update(
    id: number,
    product: NewProduct,
  ): Promise<ApiResponse<Product>> {
    return this.client.put<Product>(this.url(id), { data: product });
  }

  /** PARTIAL UPDATE — PATCH /products/{id}. */
  public patch(
    id: number,
    partial: Partial<NewProduct>,
  ): Promise<ApiResponse<Product>> {
    return this.client.patch<Product>(this.url(id), { data: partial });
  }

  /** DELETE — DELETE /products/{id} (returns the product with soft-delete flags). */
  public remove(id: number): Promise<ApiResponse<DeletedProduct>> {
    return this.client.del<DeletedProduct>(this.url(id));
  }
}
