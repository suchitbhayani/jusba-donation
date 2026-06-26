export type Event = {
  id: string
  name: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export type Pledge = {
  id: string
  name: string
  email: string
  phone: string
  amount: number
  event_id: string
  payment_received: boolean
  created_at: string
  events?: Pick<Event, 'name'>
}

export type PledgeFormData = {
  name: string
  email: string
  phone: string
  amount: string
  event_id: string
}
