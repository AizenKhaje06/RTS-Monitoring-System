'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, MessageSquare, Edit, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function WriteBackModal({ type, trigger, onSubmit, loading }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    note: '',
    resolutionNote: '',
    status: '',
    column: '',
    newValue: '',
  });

  const handleSubmit = async () => {
    try {
      await onSubmit(formData);
      setFormData({
        note: '',
        resolutionNote: '',
        status: '',
        column: '',
        newValue: '',
      });
      setOpen(false);
      toast.success('Update submitted successfully');
    } catch (error) {
      toast.error('Failed to submit update');
    }
  };

  const renderForm = () => {
    switch (type) {
      case 'note':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                placeholder="Add a note about this order..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        );

      case 'resolve':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="resolutionNote">Resolution Note</Label>
              <Textarea
                id="resolutionNote"
                placeholder="Describe how this issue was resolved..."
                value={formData.resolutionNote}
                onChange={(e) => setFormData({ ...formData, resolutionNote: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        );

      case 'status':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="column">Column to Update</Label>
              <Select value={formData.column} onValueChange={(value) => setFormData({ ...formData, column: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="H">Pending Not Printed</SelectItem>
                  <SelectItem value="K">Printed Waybill</SelectItem>
                  <SelectItem value="N">Fulfilled Order</SelectItem>
                  <SelectItem value="X">In Transit</SelectItem>
                  <SelectItem value="AA">On Delivery</SelectItem>
                  <SelectItem value="AD">Detained</SelectItem>
                  <SelectItem value="AG">Delivered</SelectItem>
                  <SelectItem value="AJ">Cancelled</SelectItem>
                  <SelectItem value="AM">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="newValue">New Value</Label>
              <Input
                id="newValue"
                type="number"
                placeholder="Enter new value"
                value={formData.newValue}
                onChange={(e) => setFormData({ ...formData, newValue: e.target.value })}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'note':
        return 'Add Note';
      case 'resolve':
        return 'Mark as Resolved';
      case 'status':
        return 'Update Status';
      default:
        return 'Update';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'note':
        return 'Add a note to track this order.';
      case 'resolve':
        return 'Mark this issue as resolved and add resolution details.';
      case 'status':
        return 'Update the status of this order.';
      default:
        return '';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'note':
        return <MessageSquare className="h-5 w-5" />;
      case 'resolve':
        return <CheckCircle className="h-5 w-5" />;
      case 'status':
        return <Edit className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        {renderForm()}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
