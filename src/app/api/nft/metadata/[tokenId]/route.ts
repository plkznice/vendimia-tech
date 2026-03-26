import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await params

  const supabase = createAdminClient()

  // Fetch certificate row; join students via foreign key
  const { data: certificate, error } = await supabase
    .from('certificates')
    .select(`
      nft_token_id,
      pdf_url,
      tx_hash,
      chain,
      created_at,
      students (
        name,
        university,
        career
      )
    `)
    .eq('nft_token_id', tokenId)
    .single()

  if (error || !certificate) {
    return NextResponse.json(
      { error: 'Certificate not found' },
      { status: 404 }
    )
  }

  // students may be a single object (many-to-one FK) or null
  const student = Array.isArray(certificate.students)
    ? certificate.students[0]
    : certificate.students

  const studentName: string = student?.name ?? 'Estudiante'
  const university: string = student?.university ?? ''
  const career: string = student?.career ?? ''
  const pdfUrl: string = certificate.pdf_url ?? ''
  const createdAt: string = certificate.created_at
    ? new Date(certificate.created_at).toISOString().split('T')[0]
    : ''

  const metadata = {
    name: `Certificado Académico - ${studentName}`,
    description: `Certificado académico verificado en blockchain.\nUniversidad: ${university}\nCarrera: ${career}`,
    image: pdfUrl,
    external_url: pdfUrl,
    attributes: [
      { trait_type: 'Universidad', value: university },
      { trait_type: 'Carrera', value: career },
      { trait_type: 'Fecha', value: createdAt },
    ],
  }

  return NextResponse.json(metadata, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
