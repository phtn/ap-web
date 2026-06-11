import {InsuranceContent} from './content'
interface Props {
  params: Promise<{type: string}>
}
const Page = async ({params}: Props) => {
  const type = (await params).type
  return <InsuranceContent type={type} />
}
export default Page
