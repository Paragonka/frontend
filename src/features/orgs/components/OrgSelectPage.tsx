import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useCreateOrg, useOrgs, useSelectOrg } from '../hooks/useOrgs'

const orgSchema = z.object({ name: z.string().min(1, 'Name is required') })
type OrgForm = z.infer<typeof orgSchema>

export function OrgSelectPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: orgs, isLoading } = useOrgs()
  const createOrg = useCreateOrg()
  const selectOrg = useSelectOrg()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
  })

  const handleSelect = (orgId: string) => {
    selectOrg(orgId)
    navigate(`/app/${orgId}`)
  }

  if (isLoading) return <div>{t('Loading...')}</div>

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg space-y-6">
        <h1 className="text-2xl font-bold text-center">{t('Select organization')}</h1>

        {orgs?.length ? (
          <div className="space-y-2">
            {orgs.map((org) => (
              <button
                type="button"
                key={org.id}
                onClick={() => handleSelect(org.id)}
                className="w-full text-left p-4 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium">{org.name}</p>
                <p className="text-sm text-gray-500">{org.timezone}</p>
              </button>
            ))}
          </div>
        ) : null}

        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold mb-2">{t('Create organization')}</h2>
          <form onSubmit={handleSubmit((data) => createOrg.mutate(data))} className="flex gap-2">
            <input
              {...register('name')}
              placeholder={t('Organization name')}
              className="flex-1 border rounded px-3 py-2"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {t('Create')}
            </button>
          </form>
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
      </div>
    </div>
  )
}
