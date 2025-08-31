export interface Expense {
  expenseId: string;
  userId: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseRequest {
  title: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  tags?: string[];
}

export interface UpdateExpenseRequest {
  title?: string;
  amount?: number;
  category?: string;
  date?: string;
  description?: string;
  tags?: string[];
}

export interface ExpenseQueryParams {
  userId: string;
  startDate?: string | undefined;
  endDate?: string | undefined;
  category?: string | undefined;
  minAmount?: number | undefined;
  maxAmount?: number | undefined;
  limit?: number | undefined;
  nextToken?: string | undefined;
}

export interface ExpenseResponse {
  success: boolean;
  data?: Expense | Expense[];
  message?: string;
  error?: string;
  nextToken?: string;
}

export interface AuthContext {
  userId: string;
  email: string;
  groups?: string[];
}

export interface APIResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export interface DynamoDBItem {
  [key: string]: any;
}

export interface PaginationResult<T> {
  items: T[];
  nextToken?: string | undefined;
  hasMore: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  currency?: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}
