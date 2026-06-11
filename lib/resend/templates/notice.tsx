import { Body, Container, Head, Html, Section, Text } from '@react-email/components'
import Link from 'next/link'

interface KoalaWelcomeEmailProps {
  userFirstname: string
}

// const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''

export const KoalaWelcomeEmail = ({ userFirstname }: KoalaWelcomeEmailProps) => (
  <Html>
    <Head />
    <Section>
      <Body className='bg-white font-koala'>
        <Container className='mx-auto py-5 pb-12'>
          <Text className='text-[16px] leading-6.5'>Hi {userFirstname},</Text>
          <Text className='text-[16px] leading-6.5'>
            Welcome to Koala, the sales intelligence platform that helps you uncover qualified leads and close deals
            faster.
          </Text>
          <Section className='text-center'>
            <Link
              className='bg-[#5F51E8] rounded-[3px] text-white text-[16px] no-underline text-center block p-3'
              href='https://protap.ph'>
              Hop-in
            </Link>
          </Section>
          <Text className='text-[16px] leading-6.5'>
            Best,
            <br />
            The Koala team
          </Text>
          <Section className='border-[#cccccc] my-5' />
          <Text className='text-[#8898aa] text-[12px]'>470 Noor Ave STE B #1148, South San Francisco, CA 94080</Text>
        </Container>
      </Body>
    </Section>
  </Html>
)

KoalaWelcomeEmail.PreviewProps = {
  userFirstname: 'Alan'
} as KoalaWelcomeEmailProps

export default KoalaWelcomeEmail
