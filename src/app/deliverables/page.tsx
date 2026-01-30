'use client';

import { useState } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useOrder } from "@/context/OrderContext";
import { useRouter } from "next/navigation";
import { productCatalog } from '@/lib/product-data';
import type { ConfiguredProduct, Product } from '@/lib/types';
import { Search, Package, Edit, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProductConfigurator } from '@/components/flow2/ProductConfigurator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useHeaderSummary } from '@/hooks/use-header-summary';

export default function DeliverablesPage() {
    const router = useRouter();
    const { order, addDeliverable, updateDeliverable, removeDeliverable, saveAsDraft } = useOrder();
    const headerSummary = useHeaderSummary(order.eventDetails);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [editingProduct, setEditingProduct] = useState<ConfiguredProduct | null>(null);

    const handleAddProductClick = (product: Product) => {
        setSelectedProduct(product);
        setEditingProduct(null);
        setIsConfiguratorOpen(true);
    };

    const handleEditProductClick = (configuredProduct: ConfiguredProduct) => {
        const product = productCatalog.find(p => p.id === configuredProduct.productId);
        if (product) {
            setSelectedProduct(product);
            setEditingProduct(configuredProduct);
            setIsConfiguratorOpen(true);
        }
    };

    const handleSaveProduct = (configuredProduct: ConfiguredProduct) => {
        if (editingProduct) {
            updateDeliverable(configuredProduct.id, configuredProduct);
        } else {
             // Handle duplicate naming for new products
            const existingItems = order.deliverables.filter(item => item.productId === configuredProduct.productId).length;
            if (existingItems > 0) {
                configuredProduct.productName = `${configuredProduct.productName} #${existingItems + 1}`;
            }
            addDeliverable(configuredProduct);
        }
    };

    const filteredProducts = productCatalog.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isProductInCart = (productId: number) => {
        return order.deliverables.some(item => item.productId === productId);
    }

    return (
        <>
            <AppLayout>
                <div className="flex flex-col h-screen">
                    <header className="sticky top-0 z-10 flex h-20 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
                        <MobileNav />
                        <div className="flex-1">
                            <h1 className="font-semibold text-lg md:text-xl font-headline truncate" title={headerSummary}>
                                {headerSummary}
                            </h1>
                            <p className="text-sm text-muted-foreground">Deliverables</p>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="hidden lg:block font-mono text-sm">
                                {order.orderId}
                            </div>
                            <div className="relative flex-1 md:grow-0">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search products..."
                                    className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 grid md:grid-cols-2 gap-8">
                        <div className="md:col-span-1 flex flex-col gap-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Product Catalog</CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[calc(100vh-250px)] overflow-y-auto p-4">
                                    {filteredProducts.map(product => (
                                        <Card key={product.id} className={`flex flex-col ${isProductInCart(product.id) ? 'bg-primary/5' : ''}`}>
                                            <CardHeader>
                                                <CardTitle className="text-base">{product.name}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="flex-grow flex flex-col justify-end">
                                                <Button size="sm" onClick={() => handleAddProductClick(product)}>Add to Order</Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {filteredProducts.length === 0 && <p className="text-muted-foreground p-4">No products found.</p>}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="md:col-span-1 flex flex-col gap-8">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Selected Deliverables</CardTitle>
                                    <Badge variant="secondary">{order.deliverables.length} items</Badge>
                                </CardHeader>
                                <CardContent className="max-h-[calc(100vh-250px)] overflow-y-auto p-4">
                                    {order.deliverables.length === 0 ? (
                                        <div className="text-center text-muted-foreground py-12">
                                            <Package className="mx-auto h-12 w-12" />
                                            <p className="mt-4">No items added yet.</p>
                                            <p className="text-sm">Select products from the catalog.</p>
                                        </div>
                                    ) : (
                                        <TooltipProvider>
                                            <ul className="space-y-4">
                                                {order.deliverables.map(item => (
                                                    <li key={item.id} className="flex justify-between items-center p-3 border rounded-lg bg-card-foreground/5">
                                                        <div className="flex items-center gap-2">
                                                            {item.warning && (
                                                                <Tooltip>
                                                                    <TooltipTrigger>
                                                                        <AlertTriangle className="h-5 w-5 text-accent" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{item.warning}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                            <div>
                                                                <p className="font-semibold">{item.productName}</p>
                                                                <p className="text-sm text-muted-foreground">{item.variant || 'Standard'}</p>
                                                            </div>
                                                        </div>
                                                        <div className='flex items-center gap-1'>
                                                            <Button variant="ghost" size="icon" onClick={() => handleEditProductClick(item)}><Edit className="h-4 w-4" /></Button>
                                                            <Button variant="ghost" size="sm" onClick={() => removeDeliverable(item.id)}>Remove</Button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </TooltipProvider>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </main>

                    <footer className="sticky bottom-0 z-10 flex items-center justify-between gap-4 border-t bg-background px-4 md:px-6 h-20">
                         <Button variant="outline" onClick={() => router.back()}>Back</Button>
                        <div className="flex items-center gap-4">
                            <Button variant="secondary" onClick={saveAsDraft}>Save as Draft</Button>
                            <Button
                                onClick={() => router.push('/commercials')}
                                disabled={order.deliverables.length === 0}
                                className="bg-accent text-accent-foreground hover:bg-accent/90"
                            >
                                Next Step (Commercials)
                            </Button>
                        </div>
                    </footer>
                </div>
            </AppLayout>
            <ProductConfigurator
                isOpen={isConfiguratorOpen}
                onClose={() => setIsConfiguratorOpen(false)}
                product={selectedProduct}
                configuredProduct={editingProduct}
                onSave={handleSaveProduct}
            />
        </>
    );
}
