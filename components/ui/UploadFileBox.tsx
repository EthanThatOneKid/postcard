import { 
  Field, 
  FieldLabel, 
  FieldDescription 
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function EvidenceUpload() {
  return (
    <div className="w-full max-w-sm">
      <Field>
        <FieldLabel htmlFor="picture">Evidence Image</FieldLabel>
        <Input 
          id="picture" 
          type="file" 
          className="cursor-pointer" 
          accept="image/*"
        />
        <FieldDescription>
          Upload a screenshot of the social media post.
        </FieldDescription>
      </Field>
    </div>
  )
}