"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { FormField } from "@/components/shared/form-field"
import { FilterSelect } from "@/components/shared/data-table"
import { cities } from "@/lib/data/seed"

export function NewClientButton() {
  const [open, setOpen] = useState(false)
  const [city, setCity] = useState<string>(cities[0])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const name = new FormData(e.currentTarget).get("name")
    toast.success(`Client « ${name} » créé`, {
      description: "Le dossier KYC est en attente de vérification.",
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" className="h-10 px-4" />}>
        <Plus />
        Nouveau client
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Nouveau client</DialogTitle>
            <DialogDescription>
              Renseignez les informations du client. Les pièces KYC pourront être ajoutées ensuite.
            </DialogDescription>
          </DialogHeader>

          <FormField label="Type de client">
            <RadioGroup defaultValue="particulier" className="flex gap-6">
              <Label className="flex items-center gap-2 font-normal">
                <RadioGroupItem value="particulier" /> Particulier
              </Label>
              <Label className="flex items-center gap-2 font-normal">
                <RadioGroupItem value="entreprise" /> Entreprise
              </Label>
            </RadioGroup>
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nom complet / raison sociale" htmlFor="name" className="sm:col-span-2">
              <Input id="name" name="name" required placeholder="ex. MUKENGE Jean" />
            </FormField>
            <FormField label="Téléphone" htmlFor="phone">
              <Input id="phone" name="phone" type="tel" required placeholder="+243 97 000 0000" />
            </FormField>
            <FormField label="E-mail" htmlFor="email">
              <Input id="email" name="email" type="email" placeholder="nom@exemple.cd" />
            </FormField>
            <FormField label="Ville">
              <FilterSelect
                items={cities.map((c) => ({ value: c, label: c }))}
                value={city}
                onChange={setCity}
                className="w-full text-sm"
              />
            </FormField>
            <FormField label="N° pièce d'identité" htmlFor="idNumber">
              <Input id="idNumber" name="idNumber" placeholder="Carte d'électeur, passeport..." />
            </FormField>
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Annuler</DialogClose>
            <Button type="submit">Créer le client</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
