import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useSetupInfo } from '@/hooks/useSetupInfo';

export function SetupPage() {
  const { info, error, loading, reload } = useSetupInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado del entorno</CardTitle>
        <CardDescription>Comprobacion de conectividad con el backend (Fase 0)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <p className="text-muted-foreground">Conectando con el backend…</p>}
        {info && (
          <ul className="space-y-2 text-sm">
            <li>
              <strong>API:</strong> {info.application} — {info.status}
            </li>
            <li>
              <strong>Fase:</strong> {info.phase}
            </li>
            <li>{info.message}</li>
            <li>
              <small className="text-muted-foreground">{info.timestamp}</small>
            </li>
          </ul>
        )}
        {error && (
          <p className="text-sm text-destructive">No se pudo contactar el backend: {error}</p>
        )}
        <Button type="button" variant="outline" onClick={() => void reload()} disabled={loading}>
          Reintentar
        </Button>
      </CardContent>
    </Card>
  );
}
