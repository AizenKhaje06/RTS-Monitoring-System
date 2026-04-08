"use client"

import { useState, useEffect } from "react"
import { Package, Plus, Trash2, Loader2, Save, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Item {
  id: number
  item_name: string
  description: string
  default_price: number
  is_active: boolean
}

export function ItemsManagementModal() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string } | null>(null)
  const [itemToSave, setItemToSave] = useState<Item | null>(null)
  const { toast } = useToast()

  // New item form
  const [newItem, setNewItem] = useState({
    item_name: "",
    description: "",
    default_price: 0,
  })

  // Fetch items when modal opens
  useEffect(() => {
    if (open) {
      fetchItems()
    }
  }, [open])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/items")
      const data = await response.json()
      
      if (response.ok) {
        setItems(data.items || [])
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load items",
        })
      }
    } catch (error) {
      console.error("Error fetching items:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load items",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async () => {
    if (!newItem.item_name.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Item name is required",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newItem),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create item")
      }

      toast({
        title: "Item Added",
        description: `Successfully added ${newItem.item_name}`,
      })

      // Reset form
      setNewItem({
        item_name: "",
        description: "",
        default_price: 0,
      })

      // Refresh list
      await fetchItems()
    } catch (error) {
      console.error("Error adding item:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateItem = async (item: Item) => {
    setItemToSave(item)
    setSaveDialogOpen(true)
  }

  const confirmSave = async () => {
    if (!itemToSave) return

    setSavingId(itemToSave.id)
    try {
      const response = await fetch("/api/items", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemToSave),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update item")
      }

      toast({
        title: "Changes Saved",
        description: `Successfully updated ${itemToSave.item_name}`,
      })
    } catch (error) {
      console.error("Error updating item:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update item",
      })
    } finally {
      setSavingId(null)
      setSaveDialogOpen(false)
      setItemToSave(null)
    }
  }

  const handleDeleteItem = async (id: number, itemName: string) => {
    setItemToDelete({ id, name: itemName })
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    console.log('🗑️ Attempting to delete item:', itemToDelete)

    try {
      const response = await fetch(`/api/items?id=${itemToDelete.id}`, {
        method: "DELETE",
      })

      const result = await response.json()
      console.log('📥 Delete response:', result)

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete item")
      }

      toast({
        title: "Item Deleted",
        description: `Successfully deleted ${itemToDelete.name}`,
      })

      // Refresh list
      await fetchItems()
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete item",
      })
    } finally {
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  const handleItemChange = (id: number, field: keyof Item, value: string | number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Package className="h-4 w-4" />
          Manage Items
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Items</DialogTitle>
          <DialogDescription>
            Add new items or edit existing ones
          </DialogDescription>
        </DialogHeader>

        {/* Add New Item Form */}
        <div className="border rounded-lg p-4 bg-muted/50">
          <h3 className="text-sm font-semibold mb-3">Add New Item</h3>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-4">
              <Label htmlFor="new-item-name" className="text-xs">Item Name</Label>
              <Input
                id="new-item-name"
                value={newItem.item_name}
                onChange={(e) => setNewItem(prev => ({ ...prev, item_name: e.target.value }))}
                placeholder="e.g., T-Shirt"
                className="h-9"
              />
            </div>
            <div className="col-span-4">
              <Label htmlFor="new-item-desc" className="text-xs">Description</Label>
              <Input
                id="new-item-desc"
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Cotton T-Shirt"
                className="h-9"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="new-item-price" className="text-xs">Price</Label>
              <Input
                id="new-item-price"
                type="number"
                value={newItem.default_price}
                onChange={(e) => setNewItem(prev => ({ ...prev, default_price: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                step="0.01"
                className="h-9"
              />
            </div>
            <div className="col-span-2 flex items-end">
              <Button 
                onClick={handleAddItem} 
                disabled={loading}
                className="w-full h-9"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Item Name</TableHead>
                <TableHead className="w-[22%]">Description</TableHead>
                <TableHead className="w-[18%]">Price</TableHead>
                <TableHead className="w-[15%]">Save</TableHead>
                <TableHead className="w-[15%]">Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No items found. Add your first item above.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="py-2">
                      <Textarea
                        value={item.item_name}
                        onChange={(e) => handleItemChange(item.id, 'item_name', e.target.value)}
                        className="min-h-[32px] h-auto text-xs leading-tight py-1.5 resize-none"
                        rows={1}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement
                          target.style.height = 'auto'
                          target.style.height = target.scrollHeight + 'px'
                        }}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <Input
                        type="number"
                        value={item.default_price}
                        onChange={(e) => handleItemChange(item.id, 'default_price', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        className="h-8 text-xs"
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUpdateItem(item)}
                        disabled={savingId === item.id}
                        className="h-8 w-full"
                      >
                        {savingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="py-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteItem(item.id, item.item_name)}
                        className="h-8 w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
              </div>
              <div>
                <AlertDialogTitle>Delete Item</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{itemToDelete?.name}"?
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="text-sm text-muted-foreground mt-2">
            This action cannot be undone. The item will be removed from the system and won't appear in the order form dropdown.
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
              </div>
              <div>
                <AlertDialogTitle>Save Changes</AlertDialogTitle>
                <AlertDialogDescription>
                  Save changes to "{itemToSave?.item_name}"?
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="text-sm text-muted-foreground mt-2">
            <div className="space-y-1">
              <p><span className="font-medium">Item Name:</span> {itemToSave?.item_name}</p>
              <p><span className="font-medium">Description:</span> {itemToSave?.description || "N/A"}</p>
              <p><span className="font-medium">Price:</span> ₱{itemToSave?.default_price.toFixed(2)}</p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSave}
              className="bg-green-600 hover:bg-green-700 focus:ring-green-600"
            >
              {savingId === itemToSave?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
