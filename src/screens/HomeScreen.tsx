import { createParam } from 'solito';
import { useLink } from 'solito/link';
import { YStack, XStack, H1, Paragraph, Button } from '@tamagui/core';
import { Card } from '@loreon/tamagui-ui';

export function HomeScreen() {
  const visualizerLink = useLink({ href: '/visualizer' });
  const testLink = useLink({ href: '/test' });
  const settingsLink = useLink({ href: '/settings' });

  return (
    <YStack flex={1} padding='$4' backgroundColor='$background'>
      <YStack maxWidth={1200} alignSelf='center' width='100%'>
        <YStack marginBottom='$8'>
          <H1
            fontSize='$12'
            fontWeight='bold'
            marginBottom='$4'
            textAlign='center'
          >
            🚀 Bienvenido a Loreon
          </H1>
          <Paragraph
            fontSize='$6'
            opacity={0.8}
            lineHeight='$2'
            textAlign='center'
          >
            Tu plataforma integral para gestión de contenido markdown y
            sincronización con bases de datos.
          </Paragraph>
        </YStack>

        <XStack $sm={{ flexDirection: 'column' }} gap='$4' marginBottom='$8'>
          <Card
            title='📚 Visualizador'
            description='Explora y visualiza archivos markdown de manera elegante.'
            variant='glass'
          >
            <Button {...visualizerLink} backgroundColor='$info' color='white'>
              Abrir Visualizador
            </Button>
          </Card>

          <Card
            title='🧪 Tester'
            description='Herramientas de testing para validar la integridad de tus repositorios.'
            variant='glass'
          >
            <Button {...testLink} backgroundColor='$warning' color='white'>
              Abrir Tester
            </Button>
          </Card>

          <Card
            title='🔌 Connect'
            description='Conecta y sincroniza con múltiples bases de datos.'
            variant='glass'
          >
            <Button {...settingsLink} backgroundColor='$success' color='white'>
              Configurar
            </Button>
          </Card>
        </XStack>
      </YStack>
    </YStack>
  );
}
