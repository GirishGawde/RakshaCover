import unittest

from cluster.clustering import ClusterStore
from cluster.graph_builder import build_graph
from cluster.models import Report


class ClusterTests(unittest.TestCase):
    def test_similar_reports_join_and_unrelated_report_seeds_cluster(self):
        store = ClusterStore(similarity_threshold=0.4)
        first = Report(
            report_id="r1",
            description="urgent KYC update click link account blocked",
            payment_handle="fraud@upi",
            amount=5000,
            channel_sequence=["sms", "whatsapp"],
            fraud_type="upi",
        )
        similar = first.model_copy(update={"report_id": "r2", "description": "urgent KYC update click link account frozen"})
        unrelated = Report(
            report_id="r3",
            description="work from home registration fee interview",
            payment_handle="jobs@upi",
            amount=500,
            channel_sequence=["telegram"],
            fraud_type="job",
        )

        first_cluster, _, first_created = store.add(first)
        similar_cluster, similarity, similar_created = store.add(similar)
        unrelated_cluster, _, unrelated_created = store.add(unrelated)

        self.assertTrue(first_created)
        self.assertFalse(similar_created)
        self.assertGreaterEqual(similarity, 0.4)
        self.assertEqual(first_cluster.cluster_id, similar_cluster.cluster_id)
        self.assertTrue(unrelated_created)
        self.assertNotEqual(first_cluster.cluster_id, unrelated_cluster.cluster_id)

    def test_graph_only_emits_edges_with_shared_behavior(self):
        store = ClusterStore(similarity_threshold=1.0)
        store.add(Report(report_id="a", description="kyc link", payment_handle="same@upi", channel_sequence=["sms"], fraud_type="upi"))
        store.add(Report(report_id="b", description="parcel delivery", payment_handle="same@upi", channel_sequence=["sms"], fraud_type="upi"))
        graph = build_graph(store.clusters)
        self.assertEqual(len(graph.nodes), 2)
        self.assertEqual(len(graph.edges), 1)
        self.assertIn("payment_handle", graph.edges[0].shared_signals)


if __name__ == "__main__":
    unittest.main()
