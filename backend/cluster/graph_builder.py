"""NetworkX graph export for Module D's cluster visualisation."""

import networkx as nx

from cluster.clustering import Cluster
from cluster.models import GraphEdge, GraphNode, GraphResponse


DEFAULT_EDGE_THRESHOLD = 0.28


def build_graph(clusters: list[Cluster], edge_threshold: float = DEFAULT_EDGE_THRESHOLD) -> GraphResponse:
    graph = nx.Graph()
    for cluster in clusters:
        for report in cluster.reports:
            victim_id = f"victim_{report.report_id}"
            graph.add_node(
                victim_id,
                label=f"Victim: {report.report_id}",
                type="victim"
            )
            
            vpa_id = None
            if report.payment_handle:
                vpa_id = f"vpa_{report.payment_handle.lower()}"
                graph.add_node(
                    vpa_id,
                    label=report.payment_handle,
                    type="mule_vpa"
                )
                graph.add_edge(victim_id, vpa_id, weight=0.9, shared_signals=["payment_handle"])
                
            if report.fraud_type:
                pattern_id = f"pattern_{report.fraud_type.lower()}"
                graph.add_node(
                    pattern_id,
                    label=f"Pattern: {report.fraud_type}",
                    type="script_pattern"
                )
                if vpa_id:
                    graph.add_edge(vpa_id, pattern_id, weight=0.8, shared_signals=["fraud_type"])
                else:
                    graph.add_edge(victim_id, pattern_id, weight=0.8, shared_signals=["fraud_type"])

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
