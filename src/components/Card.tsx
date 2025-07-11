import { styled, YStack, H3, Paragraph } from '@tamagui/core';

const CardContainer = styled(YStack, {
  backgroundColor: '$backgroundTransparent',
  borderRadius: '$4',
  borderWidth: 1,
  borderColor: '$borderColor',
  padding: '$4',
  minHeight: 200,
  backdropFilter: 'blur(10px)',

  variants: {
    variant: {
      glass: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
      },
      solid: {
        backgroundColor: '$background',
        borderColor: '$borderColor',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'glass',
  },
});

const CardTitle = styled(H3, {
  color: '$color',
  fontWeight: '600',
  marginBottom: '$2',
  fontSize: '$6',
});

const CardDescription = styled(Paragraph, {
  color: '$colorPress',
  lineHeight: 1.6,
  opacity: 0.8,
  marginBottom: '$3',
  fontSize: '$4',
});

const CardContent = styled(YStack, {
  flex: 1,
  justifyContent: 'space-between',
});

interface CardProps {
  title: string;
  description: string;
  titleAs?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  variant?: 'glass' | 'solid';
  children?: React.ReactNode;
}

export const Card = ({
  title,
  description,
  titleAs = 'h3',
  variant = 'glass',
  children,
}: CardProps) => {
  return (
    <CardContainer variant={variant}>
      <CardContent>
        <YStack>
          <CardTitle as={titleAs}>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </YStack>
        {children && <YStack marginTop='$3'>{children}</YStack>}
      </CardContent>
    </CardContainer>
  );
};
