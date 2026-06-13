export interface EavAttribute {
  id: string
  org_id: string
  entity_code: 'client' | 'product' | 'order'
  code: string
  name: string
  field_type: 'string' | 'number' | 'boolean' | 'date' | 'text'
  is_required: boolean
  default_value: string
}

export interface EavAttributeCreate {
  entity_code: string
  code: string
  name: string
  field_type?: string
  is_required?: boolean
  default_value?: string
}
