import { Checkbox } from "@/components/ui/checkbox"

export default function CheckboxDemo() {
  return (
    <div className="flex items-center space-x-8">
      <Checkbox />
      <Checkbox defaultChecked />
    </div>
  )
}

