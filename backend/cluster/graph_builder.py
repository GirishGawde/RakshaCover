"""NetworkX graph export for Module D's cluster visualisation."""

import networkx as nx

from clustering import Cluster
from models import GraphEdge, GraphNode, GraphResponse


DEFAULT_EDGE_THRESHOLD = 0.28


def build_graph(clusters: list[Cluster], edge_threshold: float = DEFAULT_EDGE_THRESHOLD) -> GraphResponse:
    graph = nx.Graph()
    for cluster in clusters:
        fraud_types = sorted({report.fraud_type for report in cluster.reports if report.fraud_type})
        graph.add_node(
            cluster.cluster_id,
            label=f"Cluster {cluster.cluster_id.rsplit('-', 1)[-1]}",
            report_count=len(cluster.reports),
            confidence=cluster.confidence,
            fraud_types=fraud_types,
        )

    for index, left in enumerate(clusters):
        for right in clusters[index + 1 :]:
            shared_signals = _shared_signals(left, right)
            weight = len(shared_signals) / 3
            if weight >= edge_threshold:
                graph.add_edge(
                    left.cluster_id,
                    right.cluster_id,
                    weight=round(weight, 3),
                    shared_signals=shared_signals,
                )

    return GraphResponse(
        nodes=[GraphNode(id=node, **data) for node, data in graph.nodes(data=True)],
        edges=[GraphEdge(source=left, target=right, **data) for left, right, data in graph.edges(data=True)],
        metadata={
            "node_count": graph.number_of_nodes(),
            "edge_count": graph.number_of_edges(),
            "edge_threshold": edge_threshold,
            "layout": "static-networkx",
        },
    )


def _shared_signals(left: Cluster, right: Cluster) -> list[str]:
    left_handles = {report.payment_handle.lower() for report in left.reports if report.payment_handle}
    right_handles = {report.payment_handle.lower() for report in right.reports if report.payment_handle}
    left_channels = {channel.lower() for report in left.reports for channel in report.channel_sequence}
    right_channels = {channel.lower() for report in right.reports for channel in report.channel_sequence}
    left_types = {report.fraud_type for report in left.reports if report.fraud_type}
    right_types = {report.fraud_type for report in right.reports if report.fraud_type}
    signals: list[str] = []
    if left_handles & right_handles:
        signals.append("payment_handle")
    if left_channels & right_channels:
        signals.append("channel")
    if left_types & right_types:
        signals.append("fraud_type")
    return signals
