import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import {
  MinusIcon,
  PlusIcon,
  ShoppingCart,
  CircleX,
  ChevronDownIcon,
  Ruler,
  Palette,
  Truck,
  User,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import Cart from "./cartActions";
import { handlePlaceOrder } from "./ordersActions";

import { useProducts, useCategories } from "@/hooks/useProductsQuery";
import { SHIPPING_RATES } from "@/lib/shippingRates";

const statusConfig = {
  pending: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
  shipped: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
  delivered:
    "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  default: "bg-slate-100 text-slate-700 border-slate-200",
};



export default function NewOrder() {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("pending");

  const [openCart, setOpenCart] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState("all");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [selectedGovernorate, setSelectedGovernorate] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [customGovernorate, setCustomGovernorate] = useState("");
  const [customCity, setCustomCity] = useState("");

  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    cartItems,
    setCartItems,
    countOfItems,
    subTotal,
    addGroupToCart,
    updatePiece,
    increaseCount,
    decreaseCount,
    removeFromCart,
    clearCart
  } = Cart();

  // allVariantsByName: maps product name → ALL variants across all colors
  const allVariantsByName = useMemo(() => {
    const map = new Map();
    products.forEach(p => {
      if (!map.has(p.name)) map.set(p.name, []);
      map.get(p.name).push(p);
    });
    return map;
  }, [products]);

  // Group products by name + color (so each color/photo appears as its own card)
  const groupedProducts = useMemo(() => {
    const filtered = activeCategoryId === "all"
      ? products
      : products.filter((p) => p.category_id === activeCategoryId);

    const map = new Map();
    filtered.forEach(p => {
      const key = p.color ? `${p.name}__${p.color}` : p.name;
      if (!map.has(key)) {
        map.set(key, { ...p, variants: [] });
      }
      map.get(key).variants.push(p);
    });
    return Array.from(map.values());
  }, [products, activeCategoryId]);

  const governorates = useMemo(() => {
    const names = SHIPPING_RATES.map((r) => r.governorate);
    return [...names, "أخرى"];
  }, []);

  const availableCities = useMemo(() => {
    if (!selectedGovernorate || selectedGovernorate === "أخرى") return [];
    const gov = SHIPPING_RATES.find((r) => r.governorate === selectedGovernorate);
    return gov ? gov.cities : [];
  }, [selectedGovernorate]);

  const shippingCost = useMemo(() => {
    if (!selectedGovernorate) return 0;
    if (selectedGovernorate === "أخرى") return 85;
    const gov = SHIPPING_RATES.find((r) => r.governorate === selectedGovernorate);
    if (!gov) return 85;
    if (!selectedCity || selectedCity === "أخرى") return gov.cities[0]?.price || 85;
    const cityObj = gov.cities.find((c) => c.city === selectedCity);
    return Number(cityObj?.price || 85);
  }, [selectedGovernorate, selectedCity]);

  const grandTotal = subTotal + shippingCost;
  const missingVariants = cartItems.some(i => i.pieces?.some(p => !p.variant_id));

  const handleOrder = async (status) => {
    if (cartItems.length < 1) {
      toast.warning(t("new_order.empty_cart"));
      return;
    }
    if (missingVariants) {
      toast.warning("يجب تحديد اللون والمقاس لجميع المنتجات في السلة");
      return;
    }
    if (!customerName.trim()) {
      toast.warning(t("new_order.enter_name"));
      return;
    }
    if (!customerPhone.trim()) {
      toast.warning(t("new_order.enter_phone"));
      return;
    }

    setIsSubmitting(true);
    const { success, error } = await handlePlaceOrder(
      user.id,
      cartItems,
      grandTotal,
      status,
      {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_address: [
          customerAddress,
          selectedCity === "أخرى" ? customCity : selectedCity,
          selectedGovernorate === "أخرى" ? customGovernorate : selectedGovernorate,
        ]
          .filter(Boolean)
          .join(", "),
      },
    );
    setIsSubmitting(false);

    if (success) {
      toast.success(t("new_order.success"));
      setCartItems([]);
      localStorage.removeItem("cartItemsInLS");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setSelectedGovernorate("");
      setSelectedCity("");
      setCustomGovernorate("");
      setCustomCity("");
      queryClient.invalidateQueries(["products"]);
      queryClient.invalidateQueries(["orders"]);
      openCart && setOpenCart(false);
    } else {
      toast.error(error || t("new_order.fail"));
    }
  };

  return (
    <React.Fragment>
      <button
        onClick={() => {
          setOpenCart(!openCart);
        }}
        className="lg:hidden cursor-pointer bg-primary/80 text-primary-foreground z-50 fixed bottom-6 right-6 p-4 rounded-full shadow-xl"
      >
        {countOfItems > 0 && (
          <span className="px-2.5 py-1 bg-red-600 text-white font-bold absolute -top-2 -right-2 rounded-full text-xs box-content border-2 border-white">
            {countOfItems}
          </span>
        )}
        <ShoppingCart size={24} />
      </button>

      <div className="flex w-full h-[calc(100vh-6rem)] overflow-hidden gap-4">
        {/* LEFT COLUMN: Products Grid (70%) */}
        <div className="flex-1 flex flex-col min-w-0 pr-2">
          <Tabs
            defaultValue="all"
            onValueChange={setActiveCategoryId}
            className="flex flex-col h-full"
          >
            <div className="shrink-0 mb-4 sticky top-0 z-10 bg-background/95 backdrop-blur py-2">
              <TabsList className="flex w-full justify-start overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-lg bg-muted p-1 scrollbar-hide shadow-sm border">
                <TabsTrigger value="all" className="shrink-0 cursor-pointer text-md px-6 py-2">
                  {t("new_order.all")}
                </TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger
                    value={category.id}
                    key={category.id}
                    className="shrink-0 cursor-pointer text-md px-6 py-2"
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto pb-20 pr-1 scrollbar-thin">
              <TabsContent value={activeCategoryId} className="m-0 border-none outline-none h-full">
                {groupedProducts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {groupedProducts.map((group) => {
                      const compoundStock = group.variants.reduce((acc, v) => acc + v.stock_quantity, 0);

                      return (
                        <Card
                          className={`relative flex flex-col shadow-sm pt-0 overflow-hidden transition-all group cursor-pointer border-border/60 ${compoundStock > 0 ? 'hover:border-primary/50 hover:shadow-md' : 'opacity-70'}`}
                          key={`${group.name}_${group.color}`}
                          onClick={() => {
                            if (compoundStock > 0) {
                              // Pass ALL variants of this product name so user can select any of 16 options per piece
                              const allVariants = allVariantsByName.get(group.name) || group.variants;
                              addGroupToCart({ ...group, variants: allVariants });
                              setOpenCart(true);
                            }
                          }}
                        >
                          <div className="relative aspect-square overflow-hidden bg-slate-100">
                            <img
                              src={group.image_url}
                              alt={group.name}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <Badge
                              variant="secondary"
                              className={`absolute top-2 right-2 z-10 font-bold backdrop-blur-md shadow-sm border-0
                                        ${compoundStock == 0
                                  ? "bg-slate-800/80 text-white"
                                  : compoundStock > 10
                                    ? "bg-emerald-500/90 text-white"
                                    : "bg-amber-500/90 text-white"
                                }
                                `}
                            >
                              {t("product.stock")}: {compoundStock}
                            </Badge>

                            {group.variants.length > 1 && (
                              <Badge className="absolute bottom-2 right-2 z-10 font-bold bg-black/60 hover:bg-black/80 backdrop-blur-sm border-0 text-white">
                                {group.variants.length} خيارات
                              </Badge>
                            )}
                          </div>

                          <CardHeader className="p-3 pb-0 flex-1">
                            <CardTitle className="text-base font-bold line-clamp-2 leading-tight">
                              {group.name}
                            </CardTitle>
                            <p className="text-lg font-black text-primary mt-1">{group.price} {t("new_order.egp")}</p>
                          </CardHeader>
                          <CardFooter className="p-3 pt-4 border-t mt-auto">
                            <Button
                              className="w-full font-bold transition-all"
                              disabled={compoundStock == 0}
                              variant={group.variants.length > 1 ? "secondary" : "default"}
                            >
                              {compoundStock == 0 ? (
                                t("product.out_of_stock") || "Out of Stock"
                              ) : group.variants.length > 1 ? (
                                <>
                                  تحديد الخيارات
                                </>
                              ) : (
                                <>
                                  <PlusIcon className="w-4 h-4 mr-1 ml-1" />
                                  إضافة سريعة
                                </>
                              )}
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border-dashed border-2">
                    {t("common.no_data")}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* RIGHT COLUMN: Sidebar (Cart & Form) (30%) */}
        {/* Mobile overlay */}
        <div
          onClick={() => setOpenCart(false)}
          className={`${openCart ? "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" : "hidden"} lg:hidden`}
        ></div>

        <div
          className={`${openCart ? "fixed right-0 top-0 bottom-0 z-50 w-85 shadow-2xl" : "hidden md:hidden lg:flex"}  
                    lg:w-[400px] bg-card border rounded-xl flex flex-col h-full`}
        >
          {/* MAIN SIDEBAR */}
          <div className="p-4 border-b bg-muted/20 rounded-t-xl shrink-0 flex justify-between items-center">
            <div>
              <h1 className="font-black text-xl flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-primary" /> {t("new_order.order_summary")}</h1>
              <p className="text-sm text-muted-foreground font-semibold mt-0.5">
                {t("new_order.products")}: <span className="text-foreground">{countOfItems}</span>
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-8 gap-2">
                  <Badge className={`capitalize h-5 rounded-sm ${statusConfig[status] || statusConfig.default}`}>
                    {status}
                  </Badge>
                  <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 font-semibold">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setStatus("pending")}>
                    <div className="flex items-center gap-2 text-amber-700 w-full"><div className="w-2 h-2 rounded-full bg-amber-500" />Pending</div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatus("shipped")}>
                    <div className="flex items-center gap-2 text-blue-700 w-full"><div className="w-2 h-2 rounded-full bg-blue-500" />Shipped</div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatus("delivered")}>
                    <div className="flex items-center gap-2 text-emerald-700 w-full"><div className="w-2 h-2 rounded-full bg-emerald-500" />Delivered</div>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex-1 overflow-y-auto w-full scrollbar-thin bg-slate-50/50 pb-4">
            {/* Cart Items Area */}
            <div className="p-3 space-y-3">
              {cartItems.length === 0 ? (
                <div className="text-center py-8 opacity-50">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p>السلة فارغة. قم بإضافة منتجات.</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.cartItemId}>
                    <div className="flex flex-col gap-2 bg-white rounded-lg border shadow-sm p-3 relative group animate-in fade-in duration-300">
                      <div className="flex gap-3">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          loading="lazy"
                          className="w-16 h-16 rounded-md object-cover border shrink-0"
                        />
                        <div className="flex-1">
                          <h4 className="text-sm font-bold line-clamp-1 pr-6">{item.name}</h4>
                          <div className="font-black text-primary text-sm mt-1.5 flex justify-between items-center">
                            <span>{(item.price || 0) * (item.pieces?.length || 0)} {t("new_order.egp")}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Control - shown FIRST */}
                      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t">
                        <span className="text-xs font-bold text-muted-foreground pl-1">
                          الكمية
                        </span>
                        <ButtonGroup aria-label="Quantity" className="h-7 w-26 bg-muted/20">
                          <Button variant="outline" size="icon" className="h-7 w-8" disabled={item.pieces?.length <= 1} onClick={() => decreaseCount(item.cartItemId)}>
                            <MinusIcon className="w-3 h-3" />
                          </Button>
                          <div className="flex-1 flex items-center justify-center font-bold text-sm min-w-8">{item.pieces?.length || 0}</div>
                          <Button
                            variant="outline" size="icon" className="h-7 w-8 inline-flex"
                            disabled={item.pieces?.length >= item.variants.reduce((acc, v) => acc + v.stock_quantity, 0)}
                            onClick={() => increaseCount(item.cartItemId)}
                          >
                            <PlusIcon className="w-3 h-3" />
                          </Button>
                        </ButtonGroup>
                      </div>

                      {/* Piece Rows - one per unit */}
                      <div className="flex flex-col gap-2 mt-1">
                        {item.pieces.map((piece, idx) => {
                          // Build the list of selectable variant options
                          const variantOptions = item.variants
                            .filter(v => v.stock_quantity > 0)
                            .map(v => ({
                              id: v.id,
                              label: [v.color, v.size].filter(Boolean).join(" / ") || `خيار ${v.id?.slice(-4)}`,
                              color: v.color || "",
                              size: v.size || "",
                            }));

                          const selectedLabel = piece.variant_id
                            ? variantOptions.find(o => o.id === piece.variant_id)?.label || "محدد"
                            : null;

                          return (
                            <div key={piece.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-dashed">
                              <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{idx + 1}.</span>
                              <Select
                                value={piece.variant_id || ""}
                                onValueChange={(val) => {
                                  const chosen = variantOptions.find(o => o.id === val);
                                  updatePiece(item.cartItemId, piece.id, {
                                    variant_id: val,
                                    color: chosen?.color || "",
                                    size: chosen?.size || "",
                                  });
                                }}
                              >
                                <SelectTrigger className="h-7 text-xs flex-1">
                                  <SelectValue placeholder="اختر المقاس / اللون" />
                                </SelectTrigger>
                                <SelectContent>
                                  {variantOptions.map(opt => (
                                    <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {!piece.variant_id ? (
                                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <button
                        className="absolute top-2 right-2 text-muted-foreground hover:text-rose-500 transition-colors opacity-80 hover:opacity-100 bg-white p-1 rounded-full"
                        onClick={() => removeFromCart(item.cartItemId)}
                      >
                        <CircleX size={18} fill="currentColor" className="text-white bg-foreground rounded-full" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Separator />

            {/* Customer Form Area */}
            <div className="p-4 space-y-3 bg-white">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-tight">
                <User className="w-4 h-4 text-primary" /> {t("new_order.customer_info")}
              </h3>

              <div className="space-y-2.5">
                <div>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t("new_order.name") || "الاسم بالكامل"}
                    className="h-10 text-sm font-semibold rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="رقم الهاتف (01XXXXXXXXX)"
                    className="h-10 text-sm font-semibold rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <Input
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="تفاصيل العنوان (شارع، مبنى..)"
                    className="h-10 text-sm font-semibold rounded-lg bg-slate-50"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={selectedGovernorate} onValueChange={(val) => { setSelectedGovernorate(val); setSelectedCity(""); setCustomGovernorate(""); setCustomCity(""); }}>
                    <SelectTrigger className="h-10 text-sm flex-1 font-semibold rounded-lg bg-slate-50">
                      <SelectValue placeholder={t("new_order.governorate")} />
                    </SelectTrigger>
                    <SelectContent>
                      {governorates.map((gov) => (<SelectItem key={gov} value={gov} className="font-semibold">{gov}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {selectedGovernorate !== "أخرى" && (
                    <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedGovernorate}>
                      <SelectTrigger className="h-10 text-sm flex-1 font-semibold rounded-lg bg-slate-50">
                        <SelectValue placeholder={t("new_order.city")} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCities.map((c) => (
                          <SelectItem key={c.city} value={c.city} className="font-semibold">{c.city} - {c.price}EGP</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {selectedGovernorate === "أخرى" && (
                  <Input
                    value={customGovernorate}
                    onChange={(e) => setCustomGovernorate(e.target.value)}
                    placeholder="اكتب اسم المحافظة / المنطقة"
                    className="h-10 text-sm font-semibold rounded-lg bg-slate-50"
                  />
                )}
                {selectedCity === "أخرى" && selectedGovernorate !== "أخرى" && (
                  <Input
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder="اكتب اسم المدينة"
                    className="h-10 text-sm font-semibold rounded-lg bg-slate-50"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="bg-card shrink-0 p-4 border-t rounded-b-xl shadow-[0_-10px_20px_rgba(0,0,0,0.02)] z-10 space-y-3">
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-sm font-semibold text-muted-foreground">
                <span>سعر القطع ({countOfItems} قطعة)</span>
                <span>{subTotal.toLocaleString()} {t("new_order.egp")}</span>
              </div>
              {shippingCost > 0 && (
                <div className="flex justify-between text-sm font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> تكلفة الشحن</span>
                  <span className="text-emerald-600">+{shippingCost} {t("new_order.egp")}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between text-xl font-black pt-1 items-end">
                <span>الإجمالي النهائي</span>
                <span className="text-primary text-2xl tracking-tighter">{grandTotal.toLocaleString()} <span className="text-sm font-bold text-muted-foreground -ml-1">EGP</span></span>
              </div>
            </div>

            <Button
              disabled={isSubmitting || cartItems.length === 0 || missingVariants}
              className="w-full text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 font-black h-12 rounded-xl transition-all disabled:opacity-50"
              onClick={() => handleOrder(status)}
            >
              {isSubmitting ? (
                <><Spinner className="mr-2" /> إتمام الطلب...</>
              ) : missingVariants ? (
                <>أكمل خيارات المنتجات</>
              ) : (
                <>تأكيد وحفظ الطلب</>
              )}
            </Button>
          </div>
        </div>
      </div >
    </React.Fragment >
  );
}
