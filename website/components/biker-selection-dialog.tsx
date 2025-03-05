import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Participant } from '@/types/trip';
import { Checkbox } from "@/components/ui/checkbox";

interface BikerSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bikers: Participant[];
  selectedBikers: Participant[];
  onBikerSelect: (biker: Participant) => void;
  onConfirm: () => void;
}

export function BikerSelectionDialog({
  open,
  onOpenChange,
  bikers,
  selectedBikers,
  onBikerSelect,
  onConfirm,
}: BikerSelectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Bikers</DialogTitle>
          <DialogDescription>
            Choose the bikers who will join your trip. You can select both friends and available bikers.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {bikers.map((biker) => (
              <div key={biker.id} className="flex items-center space-x-2">
                <Checkbox
                  id={biker.id}
                  checked={selectedBikers.some(b => b.id === biker.id)}
                  onCheckedChange={() => onBikerSelect(biker)}
                />
                <label
                  htmlFor={biker.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  <div className="flex items-center gap-2">
                    <span>{biker.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      biker.status === 'friend' ? 'bg-blue-100 text-blue-800' :
                      biker.status === 'available' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {biker.status}
                    </span>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            Confirm Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 