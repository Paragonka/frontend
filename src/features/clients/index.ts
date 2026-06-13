export {
  createClient,
  deleteClient,
  getAllClients,
  getClient,
  getClientOrders,
  getClients,
  updateClient,
} from './api'
export { ClientCreateDialog } from './components/ClientCreateDialog'
export { ClientEditDialog } from './components/ClientEditDialog'
export { ClientList } from './components/ClientList'
export {
  useAllClients,
  useClient,
  useClientOrders,
  useClients,
  useCreateClient,
  useDeleteClient,
  useUpdateClient,
} from './hooks/useClients'
export type { Client, ClientCreate, ClientFilters, ClientUpdate } from './types'
