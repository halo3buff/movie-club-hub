import { useEffect } from "react";
import { useLocation, useParams, useSearch } from "wouter";

export default function GroupResults() {
  const params = useParams<{ groupId: string }>();
  const search = useSearch();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const qp = new URLSearchParams(search);
    const weekOf = qp.get("weekOf");
    const target = weekOf
      ? `/groups/${params.groupId}?weekOf=${weekOf}`
      : `/groups/${params.groupId}`;
    setLocation(target, { replace: true });
  }, [params.groupId, search, setLocation]);

  return null;
}
