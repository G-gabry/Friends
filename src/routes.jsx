import { createBrowserRouter, Navigate, redirect } from "react-router-dom";
// Layouts
import DashboardLayout from "./layouts/DashboardLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import OrdersLayout from "./layouts/OrdersLayout";

// Pages
import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ProductsPage from "./pages/products/ProductsPage";
import OrdersPage from "./pages/orders/OrdersPage";
import OrderDetails from "./pages/orders/OrderDetails";
import NewOrder from "./pages/orders/NewOrder";
import EmployeesPage from "./pages/employees/Employees";
import CustomersPage from "./pages/customers/CustomersPage";
import ShippingBatchesPage from "./pages/shipping/ShippingBatchesPage";
import BatchTrackingPage from "./pages/shipping/BatchTrackingPage";
import ErrorPage from "./pages/ErrorPage";

// Loaders
import { supabase } from "./lib/supabase";
import { productsLoader } from "./pages/products/productsLoader";
import { ordersLoader } from "./pages/orders/ordersLoader";
import { employeesLoader } from "./pages/employees/employeesLoader";
import { customersLoader } from "./pages/customers/customersLoader";
import { dashboardLoader } from "./pages/dashboard/dashboardLoader";

// Fallbacks
import ProductsFallback from "./pages/products/ProductsFallback";
import OrderFallback from "./pages/orders/OrderFallback";

async function loginAction({ request }) {
  const formData = await request.formData();
  const { email, password } = Object.fromEntries(formData);
  const { error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  if (error) {
    return { error: error.message };
  }
  return redirect("/dashboard");
}

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Navigate to="/dashboard" replace />,
    },
    {
      path: "/login",
      element: <LoginPage />,
      action: loginAction,
    },
    {
      path: "/dashboard",
      element: (
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      ),
      hydrateFallbackElement: <ProductsFallback />,
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <DashboardPage />,
          loader: dashboardLoader,
        },
        {
          path: "products",
          element: <ProductsPage />,
          loader: productsLoader,
          hydrateFallbackElement: <ProductsFallback />,
        },
        {
          path: "orders",
          element: <OrdersLayout />,
          children: [
            {
              index: true,
              element: <OrdersPage />,
              loader: ordersLoader,
              hydrateFallbackElement: <OrderFallback />,
            },
            {
              path: "new",
              element: <NewOrder />,
              loader: productsLoader,
              hydrateFallbackElement: <ProductsFallback />,
            },
            {
              path: ":orderInvoice",
              element: <OrderDetails />,
              loader: ordersLoader,
              hydrateFallbackElement: <OrderFallback />,
            },
          ],
        },
        {
          path: "shipping",
          children: [
            {
              index: true,
              element: <ShippingBatchesPage />,
            },
            {
              path: ":batchId",
              element: <BatchTrackingPage />,
            },
          ]
        },
        {
          path: "customers",
          element: <CustomersPage />,
          loader: customersLoader,
          hydrateFallbackElement: <OrderFallback />,
        },
        {
          path: "employees",
          element: <EmployeesPage />,
          loader: employeesLoader,
          hydrateFallbackElement: <OrderFallback />,
        },
      ],
    },
  ],
);
