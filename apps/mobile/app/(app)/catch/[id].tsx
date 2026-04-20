import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCatchById,
  listComments,
  postComment,
  deleteComment,
  likeCatch,
  unlikeCatch,
  isCatchLikedByMe,
  supabase,
} from '@bitemap/shared';
import { colors } from '@bitemap/ui';

export default function CatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase()
      .auth.getUser()
      .then(({ data }) => setMyUserId(data.user?.id ?? null));
  }, []);

  const catchQ = useQuery({
    queryKey: ['catch', id],
    queryFn: () => (id ? getCatchById(id) : null),
    enabled: !!id,
  });

  const commentsQ = useQuery({
    queryKey: ['comments', id],
    queryFn: () => (id ? listComments(id) : []),
    enabled: !!id,
  });

  const liked = useQuery({
    queryKey: ['liked', id],
    queryFn: () => (id ? isCatchLikedByMe(id) : false),
    enabled: !!id,
  });

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!id) return;
      if (liked.data) await unlikeCatch(id);
      else await likeCatch(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['liked', id] });
      qc.invalidateQueries({ queryKey: ['catch', id] });
    },
  });

  const [commentBody, setCommentBody] = useState('');
  const commentMutation = useMutation({
    mutationFn: () => {
      if (!id) throw new Error('no id');
      return postComment(id, commentBody);
    },
    onSuccess: () => {
      setCommentBody('');
      qc.invalidateQueries({ queryKey: ['comments', id] });
      qc.invalidateQueries({ queryKey: ['catch', id] });
    },
    onError: (e: unknown) =>
      Alert.alert(
        'Could not post comment',
        e instanceof Error ? e.message : 'Unknown error',
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', id] }),
  });

  if (catchQ.isLoading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!catchQ.data) {
    return (
      <View style={styles.empty}>
        <Text>Catch not found or expired.</Text>
      </View>
    );
  }

  const c = catchQ.data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>
        {c.quantity}× catch
        {c.size_mm ? ` · ${c.size_mm}mm` : ''}
      </Text>
      <Text style={styles.meta}>
        {new Date(c.created_at).toLocaleString()}
      </Text>
      {c.location_name && (
        <Text style={styles.meta}>📍 {c.location_name}</Text>
      )}
      <Text style={styles.meta}>
        Privacy: <Text style={{ fontWeight: '700' }}>{c.privacy_level}</Text>
      </Text>

      <View style={styles.actions}>
        <Pressable
          style={[styles.action, liked.data && styles.actionActive]}
          onPress={() => toggleLike.mutate()}
          disabled={toggleLike.isPending}
        >
          <Text
            style={[styles.actionText, liked.data && styles.actionTextActive]}
          >
            {liked.data ? '♥' : '♡'} {c.like_count}
          </Text>
        </Pressable>
        <View style={styles.action}>
          <Text style={styles.actionText}>💬 {c.comment_count}</Text>
        </View>
      </View>

      {c.bait_used && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Bait</Text>
          <Text style={styles.cardValue}>{c.bait_used}</Text>
        </View>
      )}
      {c.technique && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Technique</Text>
          <Text style={styles.cardValue}>{c.technique}</Text>
        </View>
      )}

      <Text style={styles.section}>Comments</Text>
      {commentsQ.isLoading ? (
        <ActivityIndicator />
      ) : (commentsQ.data ?? []).length === 0 ? (
        <Text style={styles.emptyText}>No comments yet.</Text>
      ) : (
        (commentsQ.data ?? []).map((cm) => (
          <View key={cm.id} style={styles.comment}>
            <Text style={styles.commentBody}>{cm.body}</Text>
            <View style={styles.commentFooter}>
              <Text style={styles.commentTime}>
                {new Date(cm.created_at).toLocaleString()}
              </Text>
              {cm.user_id === myUserId && (
                <Pressable onPress={() => deleteMutation.mutate(cm.id)}>
                  <Text style={styles.commentDelete}>Delete</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))
      )}

      <View style={styles.commentInputRow}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment…"
          value={commentBody}
          onChangeText={setCommentBody}
          maxLength={500}
        />
        <Pressable
          style={styles.commentSubmit}
          disabled={commentBody.trim().length === 0 || commentMutation.isPending}
          onPress={() => commentMutation.mutate()}
        >
          <Text style={styles.commentSubmitText}>Post</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontStyle: 'italic', color: '#64748b' },
  back: { marginBottom: 10 },
  backText: { color: colors.primary, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '700', color: '#111' },
  meta: { fontSize: 13, color: '#64748b', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginVertical: 14 },
  action: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  actionActive: { backgroundColor: '#fecaca' },
  actionText: { fontSize: 14, fontWeight: '700', color: '#111' },
  actionTextActive: { color: '#b91c1c' },
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginVertical: 4,
  },
  cardLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  cardValue: { fontSize: 14, color: '#111', marginTop: 2 },
  section: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 10,
  },
  comment: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 10,
  },
  commentBody: { fontSize: 14, color: '#111' },
  commentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  commentTime: { fontSize: 12, color: '#64748b' },
  commentDelete: { fontSize: 12, color: '#b91c1c', fontWeight: '600' },
  commentInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  commentSubmit: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
  },
  commentSubmitText: { color: '#fff', fontWeight: '700' },
});
