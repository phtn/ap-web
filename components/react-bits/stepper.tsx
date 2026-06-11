import { Icon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { ClassName } from '@/types'
import { AnimatePresence, motion, Variants } from 'motion/react'
import { useTheme } from 'next-themes'
import React, { Children, HTMLAttributes, ReactNode, SVGProps, useLayoutEffect, useMemo, useRef, useState } from 'react'

interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  initialStep?: number
  currentStep?: number
  isLoading?: boolean
  onStepChange?: (step: number) => void
  onFinalStepCompleted?: () => void
  indicatorVariant?: 'default' | 'outline'
  getStepValidation?: (step: number) => 'valid' | 'invalid' | 'unknown'
  onNextAttempt?: (step: number) => boolean
  getNextDisabled?: (step: number, isLastStep: boolean) => boolean
  stepCircleContainerClassName?: ClassName
  stepContainerClassName?: ClassName
  contentClassName?: ClassName
  contentContainerClassName?: ClassName
  footerClassName?: ClassName
  backButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>
  nextButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>
  backButtonText?: string
  nextButtonText?: string
  disableStepIndicators?: boolean
  renderStepIndicator?: (props: {
    step: number
    currentStep: number
    onStepClick: (clicked: number) => void
    validation: 'valid' | 'invalid' | 'unknown'
  }) => ReactNode
}

export function Stepper({
  children,
  isLoading,
  initialStep = 1,
  currentStep: controlledStep,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  indicatorVariant = 'default',
  getStepValidation = () => 'unknown',
  onNextAttempt,
  getNextDisabled,
  stepContainerClassName = '',
  contentClassName = '',
  contentContainerClassName,
  footerClassName = '',
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  disableStepIndicators = false,
  renderStepIndicator,
  ...rest
}: StepperProps) {
  const [uncontrolledStep, setUncontrolledStep] = useState<number>(initialStep)
  const [direction, setDirection] = useState<number>(0)
  const stepsArray = Children.toArray(children)
  const currentStep = controlledStep ?? uncontrolledStep
  const totalSteps = stepsArray.length
  const isCompleted = currentStep > totalSteps
  const isLastStep = currentStep === totalSteps
  const isNextDisabled = Boolean(nextButtonProps.disabled) || Boolean(getNextDisabled?.(currentStep, isLastStep))

  const updateStep = (newStep: number) => {
    if (typeof controlledStep === 'undefined') {
      setUncontrolledStep(newStep)
    }
    if (newStep > totalSteps) {
      onFinalStepCompleted()
    } else {
      onStepChange(newStep)
    }
  }

  const handleIndicatorStepClick = (clicked: number) => {
    if (clicked === currentStep) return
    if (disableStepIndicators) return

    // Keep behavior consistent with Next/Submit: allow parent to mark fields
    // dirty / persist step values before leaving the current step.
    if (onNextAttempt && onNextAttempt(currentStep) === false) return

    // Invert direction when jumping via indicators
    setDirection(clicked > currentStep ? -1 : 1)
    updateStep(clicked)
  }

  const handleBack = () => {
    if (currentStep > 1) {
      // Invert animation direction (Back should slide opposite)
      setDirection(1)
      updateStep(currentStep - 1)
    }
  }

  const handleNext = () => {
    if (!isLastStep) {
      if (onNextAttempt && onNextAttempt(currentStep) === false) return
      // Invert animation direction (Next should slide opposite)
      setDirection(-1)
      updateStep(currentStep + 1)
    }
  }

  const handleComplete = () => {
    if (onNextAttempt && onNextAttempt(currentStep) === false) return
    // Invert animation direction for completion transition
    setDirection(-1)
    updateStep(totalSteps + 1)
  }

  return (
    <div className='flex h-fit flex-1 flex-col items-center justify-start sm:aspect-4/3 ' {...rest}>
      <div className={cn('relative w-full max-w-lg md:max-w-xl overflow-hidden', contentClassName)}>
        <div className='z-10 absolute h-28 w-full top-0 left-0 bg-no-repeat bg-cover bg-[url("/svg/dots.svg")] pointer-events-none' />

        <div
          className={cn(
            ` mx-auto w-full p-6 md:p-6 space-y-4 border-[0.33px] border-t-0 border-foreground/40 shadow-xl shadow-foreground/10 relative overflow-hidden`,
            contentContainerClassName
          )}>
          <div className={`${stepContainerClassName} flex w-full items-center text-foreground`}>
            {stepsArray.map((_, index) => {
              const stepNumber = index + 1
              const isNotLastStep = index < totalSteps - 1
              const validation = getStepValidation(stepNumber)
              return (
                <React.Fragment key={stepNumber}>
                  {renderStepIndicator ? (
                    renderStepIndicator({
                      step: stepNumber,
                      currentStep,
                      onStepClick: handleIndicatorStepClick,
                      validation
                    })
                  ) : (
                    <StepIndicator
                      step={stepNumber}
                      disableStepIndicators={disableStepIndicators}
                      currentStep={currentStep}
                      variant={indicatorVariant}
                      validation={validation}
                      onClickStep={handleIndicatorStepClick}
                    />
                  )}
                  {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
                </React.Fragment>
              )
            })}
          </div>

          <StepContentWrapper
            isCompleted={isCompleted}
            currentStep={currentStep}
            direction={direction}
            className={`space-y-2 ${contentClassName}`}>
            {stepsArray[currentStep - 1]}
          </StepContentWrapper>

          {!isCompleted && (
            <div className={`${footerClassName}`}>
              <div className={`mt-10 flex ${currentStep !== 1 ? 'justify-between' : 'justify-end'}`}>
                {currentStep !== 1 && (
                  <button
                    onClick={handleBack}
                    className={`select-none duration-350 rounded px-2 py-1 transition tracking-tighter flex items-center md:space-x-1 space-x-0.5 ${
                      currentStep === 1 ? 'pointer-events-none opacity-80' : 'md:hover:opacity-70'
                    }`}
                    {...backButtonProps}>
                    <Icon name='chevron-left' className='size-4' /> <span>{backButtonText}</span>
                  </button>
                )}
                <button
                  onClick={isLastStep ? handleComplete : handleNext}
                  className={cn(
                    'select-none duration-350 flex items-center md:space-x-1 space-x-1 ps-4 pe-2 rounded-full dark:bg-white dark:text-protap-blue bg-mac-blue py-1.5 px-3.5 font-medium tracking-tighter text-white transition dark:hover:text-mac-blue',
                    {
                      'opacity-50 hover:text-mac-orange dark:hover:text-orange-200 dark:bg-white/30 dark:text-white':
                        isNextDisabled
                    }
                  )}
                  {...nextButtonProps}
                  disabled={isNextDisabled}>
                  <span>{isLastStep ? 'Submit' : nextButtonText}</span>
                  <Icon
                    name={
                      isLoading
                        ? 'spinners-ring'
                        : isNextDisabled
                          ? 'information'
                          : isLastStep
                            ? 'arrow-up'
                            : 'chevron-right'
                    }
                    className='size-4'
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface StepContentWrapperProps {
  isCompleted: boolean
  currentStep: number
  direction: number
  children: ReactNode
  className?: string
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  children,
  className = ''
}: StepContentWrapperProps) {
  const [parentHeight, setParentHeight] = useState<number>(0)
  return (
    <motion.div
      style={{ position: 'relative', overflow: 'hidden' }}
      animate={{ height: isCompleted ? 0 : parentHeight }}
      transition={{ type: 'spring', duration: 0.4 }}
      className={className}>
      <AnimatePresence initial={false} mode='sync' custom={direction}>
        {!isCompleted && (
          <SlideTransition key={currentStep} direction={direction} onHeightReady={(h) => setParentHeight(h)}>
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface SlideTransitionProps {
  children: ReactNode
  direction: number
  onHeightReady: (height: number) => void
}

function SlideTransition({ children, direction, onHeightReady }: SlideTransitionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (containerRef.current) {
      onHeightReady(containerRef.current.offsetHeight)
    }
  }, [children, onHeightReady])

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial='enter'
      animate='center'
      exit='exit'
      transition={{ duration: 0.3 }}
      style={{ position: 'absolute', left: 0, right: 0, top: 0 }}>
      {children}
    </motion.div>
  )
}

const stepVariants: Variants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? '-25%' : '25%',
    scale: dir >= 0 ? 0.95 : 0.95,
    opacity: 0.2
  }),
  center: {
    x: '0%',
    scale: 1,
    opacity: 1
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? '25%' : '-35%',
    scale: dir >= 0 ? 0.95 : 0.95,
    opacity: 0
  })
}

interface StepProps {
  children: ReactNode
}

export function Step({ children }: StepProps) {
  return <div className=''>{children}</div>
}

interface StepIndicatorProps {
  step: number
  currentStep: number
  onClickStep: (clicked: number) => void
  disableStepIndicators?: boolean
  variant?: 'default' | 'outline'
  validation?: 'valid' | 'invalid' | 'unknown'
}

function StepIndicator({
  step,
  currentStep,
  onClickStep,
  disableStepIndicators = false,
  variant = 'default',
  validation = 'unknown'
}: StepIndicatorProps) {
  const { theme } = useTheme()
  const isDark = useMemo(() => theme === 'dark', [theme])

  const status = useMemo(
    () =>
      currentStep === step
        ? 'active'
        : currentStep < step
          ? 'inactive'
          : validation === 'invalid'
            ? 'incomplete'
            : 'complete',
    [currentStep, step, validation]
  )

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) {
      onClickStep(step)
    }
  }

  const macBlue = useMemo(() => (isDark ? '#3971ff' : '#0200A1'), [isDark])

  return (
    <motion.div
      onClick={handleClick}
      className='relative cursor-pointer outline-none focus:outline-none'
      animate={status}
      initial={false}>
      <motion.div
        suppressHydrationWarning
        variants={{
          inactive: {
            scale: 1,
            backgroundColor: variant === 'outline' ? (isDark ? '#222' : '#eee') : isDark ? '#222' : '#eee',
            borderColor: validation === 'invalid' ? '#fc933b' : isDark ? '#444' : '#ddd',
            color: isDark ? '#ddd' : '#222'
          },
          active: {
            scale: 1,
            backgroundColor:
              variant === 'outline' ? 'rgba(0, 0, 0, 0)' : validation === 'invalid' ? '#fc933b' : macBlue,
            // : '#3c8df6',
            borderColor: validation === 'invalid' ? '#fc933b' : macBlue,
            color: variant === 'outline' ? macBlue : macBlue
          },
          incomplete: {
            scale: 1,
            backgroundColor: variant === 'outline' ? 'rgba(0, 0, 0, 0)' : '#fc933b',
            borderColor: '#fc933b',
            color: '#fc933b'
          },
          complete: {
            scale: 1,
            backgroundColor: macBlue,
            borderColor: macBlue,
            color: macBlue
          }
        }}
        transition={{ duration: 0.2 }}
        className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold font-space border ${
          status === 'incomplete'
            ? 'shadow-[0_0_0_3px_rgba(252, 147, 59, 0.2)]'
            : status === 'inactive'
              ? 'bg-foreground/50'
              : status === 'active'
                ? 'bg-primary'
                : validation === 'invalid' && status !== 'complete'
                  ? 'bg-[rgba(252, 147, 59,0.42)]'
                  : // ? 'shadow-[0_0_0_3px_rgba(239,68,68,0.12)]'
                    'bg-[rgba(251, 146, 60,0.12)]'
        }`}>
        {status === 'complete' ? (
          <CheckIcon className='size-5 text-white' />
        ) : status === 'incomplete' ? (
          <Icon name='alert-octagon' className={`size-9 ${variant === 'outline' ? 'text-[#fc933b]' : 'text-white'}`} />
        ) : status === 'active' ? (
          <div className={`h-4 w-4 rounded-full ${variant === 'outline' ? `bg-primary` : 'bg-mauve-500'}`} />
        ) : (
          <span className='text-sm'>{step}</span>
        )}
      </motion.div>
    </motion.div>
  )
}

interface StepConnectorProps {
  isComplete: boolean
}

function StepConnector({ isComplete }: StepConnectorProps) {
  const lineVariants: Variants = {
    incomplete: { width: 0, backgroundColor: 'rgba(0,0,0,0)' },
    complete: { width: '100%', backgroundColor: '#3971ff' }
  }

  return (
    <div className='relative mx-2 h-px flex-1 overflow-hidden bg-mac-gray/40 rounded-full'>
      <motion.div
        suppressHydrationWarning
        className='absolute left-0 top-0 h-full'
        variants={lineVariants}
        initial={false}
        animate={isComplete ? 'complete' : 'incomplete'}
        transition={{ duration: 0.4 }}
      />
    </div>
  )
}

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'>
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          delay: 0.1,
          type: 'tween',
          ease: 'easeOut',
          duration: 0.3
        }}
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M5 13l4 4L19 7'
      />
    </svg>
  )
}
